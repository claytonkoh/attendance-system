
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
from app.db.mongodb import db as db_wrapper
from app.core.config import settings
from app.models.user import UserInDB
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class TrainingService:
    def __init__(self):
        self.model = None
        self.history = None
        
    async def fetch_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Fetches user embeddings from the database and generates positive/negative pairs.
        Returns (X, y) where X is the difference vector and y is the label (1=same, 0=diff).
        """
        if not db_wrapper.client:
            logger.warning("Database client not initialized. Using synthetic data.")
            return self.generate_synthetic_data()
            
        database = db_wrapper.client[settings.DATABASE_NAME]
        users_cursor = database.users.find({"enrollment_embeddings": {"$exists": True, "$ne": []}})
        users = await users_cursor.to_list(length=1000)
        
        if len(users) < 2:
            logger.warning("Not enough real users for training. Generating SYNTHETIC data for demonstration.")
            return self.generate_synthetic_data()
            
        embeddings_map = {} # user_id -> list of embeddings
        for user in users:
            uid = str(user["_id"])
            # Ensure we have a list of embeddings
            if "enrollment_embeddings" in user and user["enrollment_embeddings"]:
                embeddings_map[uid] = user["enrollment_embeddings"]
            
        # pairs
        X_list = []
        y_list = []
        
        user_ids = list(embeddings_map.keys())
        
        if len(user_ids) < 2:
             return self.generate_synthetic_data()
        
        # Generate Positive Pairs (Same Person)
        for uid in user_ids:
            embs = embeddings_map[uid]
            # Create pairs from the 5 enrollment samples
            # 5 samples = 5*4/2 = 10 pairs per user
            for i in range(len(embs)):
                for j in range(i+1, len(embs)):
                    diff = np.abs(np.array(embs[i]) - np.array(embs[j]))
                    X_list.append(diff)
                    y_list.append(1) # Label 1: Same person
                    
        # Generate Negative Pairs (Different People)
        # We need roughly same number of negatives as positives for balance
        num_positives = len(X_list)
        import random
        
        attempts = 0
        while len(y_list) < num_positives * 2 and attempts < num_positives * 5:
            u1, u2 = random.sample(user_ids, 2)
            emb1 = random.choice(embeddings_map[u1])
            emb2 = random.choice(embeddings_map[u2])
            
            diff = np.abs(np.array(emb1) - np.array(emb2))
            X_list.append(diff)
            y_list.append(0) # Label 0: Different person
            attempts += 1
            
        return np.array(X_list), np.array(y_list)

    def generate_synthetic_data(self, n_samples=1000) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates synthetic embeddings for demonstration if database is empty.
        Simulates 2 clusters of 'distances': 
        - Small distances (positives)
        - Large distances (negatives)
        """
        # Positives: Small differences (close to 0) + noise
        X_pos = np.abs(np.random.normal(0, 0.1, (n_samples // 2, 128)))
        y_pos = np.ones(n_samples // 2)
        
        # Negatives: Larger differences + noise
        X_neg = np.abs(np.random.normal(0.5, 0.2, (n_samples // 2, 128)))
        y_neg = np.zeros(n_samples // 2)
        
        X = np.concatenate([X_pos, X_neg])
        y = np.concatenate([y_pos, y_neg])
        
        # Shuffle
        indices = np.arange(len(X))
        np.random.shuffle(indices)
        return X[indices], y[indices]

    def build_classifier_model(self):
        """
        Builds a lightweight neural network for binary classification of face similarity.
        """
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(128,)),             # Input: Difference vector (128 floats)
            tf.keras.layers.Dense(64, activation='relu'),    # Hidden layer
            tf.keras.layers.Dropout(0.3),                    # Regularization
            tf.keras.layers.Dense(32, activation='relu'),    # Hidden layer 2
            tf.keras.layers.Dense(1, activation='sigmoid')   # Output: Probability (0-1)
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        return model

    async def train_and_evaluate(self):
        """
        Main pipeline: Fetch Data -> Split -> Train -> Evaluate -> Return Report
        """
        # 1. Data Prep
        X, y = await self.fetch_training_data()
        
        # Split into Train (80%) and Test (20%)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # 2. Build Model
        self.model = self.build_classifier_model()
        
        
        # 3. Train
        history = self.model.fit(
            X_train, y_train,
            epochs=50,     # Quick training for demo
            batch_size=32,
            validation_split=0.2,
            verbose=0
        )
        self.history = history.history
        
        # SAVE THE MODEL
        import os
        model_path = os.path.join(os.getcwd(), "app", "ml_models", "face_verifier.keras")
        self.model.save(model_path)
        logger.info(f"Model saved to {model_path}")
        
        # 4. Evaluate
        y_pred_prob = self.model.predict(X_test)
        y_pred = (y_pred_prob > 0.5).astype(int).flatten()
        
        # Calculate Metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        return {
            "status": "success",
            "model_saved_at": model_path,
            "dataset_stats": {
                "total_samples": len(X),
                "training_samples": len(X_train),
                "test_samples": len(X_test)
            },
            "metrics": {
                "accuracy": float(f"{accuracy:.4f}"),
                "f1_score": float(f"{f1:.4f}"),
                "precision": float(f"{precision:.4f}"),
                "recall": float(f"{recall:.4f}")
            },
            "confusion_matrix": {
                "true_positives": int(tp),
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn)
            },
            "training_history": {
                "accuracy": [float(f"{x:.4f}") for x in history.history['accuracy']],
                "loss": [float(f"{x:.4f}") for x in history.history['loss']]
            }
        }

training_service = TrainingService()
