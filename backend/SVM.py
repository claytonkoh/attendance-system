#!/usr/bin/env python3
"""
Local Training Script for Face Verification Model (SVM VERSION)
Fetches data from DB/Local, applies Augmentation, and trains an SVM.
"""
import os
import sys
import asyncio
import numpy as np
import random
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
from sklearn.svm import SVC

# --- 1. COMPATIBILITY PATCH (TF 2.16+) ---
# We still need this because importing 'training_service' (even if just for util) 
# triggers TensorFlow imports inside the app.
import tensorflow as tf
try:
    _ = tf.keras
except AttributeError:
    try:
        import tf_keras
        tf.keras = tf_keras
    except ImportError:
        try:
            import keras
            tf.keras = keras
        except: pass
# ------------------------------------------

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Imports
from app.services.training_service import training_service
from app.db.mongodb import db as db_wrapper
from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

# --- CUSTOM DATA LOADER: DB ---
async def fetch_db_data_augmented(client):
    """
    1. Fetches Users from MongoDB.
    2. Calculates Average Embedding (Mean).
    3. Generates Synthetic Pairs.
    """
    print("   Fetching users from MongoDB...")
    db = client[settings.DATABASE_NAME]
    users_cursor = db.users.find({"enrollment_embeddings": {"$exists": True, "$ne": []}})
    users = await users_cursor.to_list(length=1000)
    
    if not users:
        print("   ⚠️ No users found in DB. Need enrollment first.")
        return np.array([]), np.array([])

    print(f"   Found {len(users)} users in DB.")
    
    X_list = []
    y_list = []
    
    user_embeddings = {}
    
    # 1. Prepare Base Vectors (Averaging)
    for user in users:
        uid = str(user["_id"])
        embs = user.get("enrollment_embeddings", [])
        if embs:
            mean_emb = np.mean(embs, axis=0)
            user_embeddings[uid] = mean_emb
            
    user_ids = list(user_embeddings.keys())
    
    # 2. Augmentation
    # We generate enough samples to ensure we have at least 100 total later
    SAMPLES_PER_USER = 10 
    print(f"   Applying Augmentation")

    for uid in user_ids:
        base_emb = user_embeddings[uid]
        
        # A. POSITIVES (Same Person)
        # Increased noise to 0.05 to make it harder/more realistic
        for _ in range(SAMPLES_PER_USER):
            noise = np.random.normal(0, 0.05, 128) 
            aug_emb = base_emb + noise
            
            diff = np.abs(base_emb - aug_emb)
            X_list.append(diff)
            y_list.append(1) # Match
            
        # B. NEGATIVES (Different People)
        if len(user_ids) > 1:
            for _ in range(SAMPLES_PER_USER):
                other_uid = random.choice([u for u in user_ids if u != uid])
                other_base = user_embeddings[other_uid]
                
                # Add noise to the other person too
                other_aug = other_base + np.random.normal(0, 0.05, 128)
                
                diff = np.abs(base_emb - other_aug)
                X_list.append(diff)
                y_list.append(0) # Mismatch
        else:
             # Fallback for 1 user
             for _ in range(SAMPLES_PER_USER):
                rand = np.random.normal(0, 1, 128)
                rand = rand / np.linalg.norm(rand)
                diff = np.abs(base_emb - rand)
                X_list.append(diff)
                y_list.append(0)
                
    return np.array(X_list), np.array(y_list)

# --- FALLBACK: LOCAL FILE (If DB is dead) ---
async def fetch_local_data_augmented():
    candidates = ["student_embeddings_deepface.npz", "../student_embeddings_deepface.npz"]
    file_path = next((p for p in candidates if os.path.exists(p)), None)
    
    if not file_path: return np.array([]), np.array([])
    print(f"📂 Loading local file: {file_path}")
    data = np.load(file_path, allow_pickle=True)
    embeddings_map = {key: data[key] for key in data.files}
    user_ids = list(embeddings_map.keys())
    
    X_list = []
    y_list = []
    SAMPLES_PER_USER = 20 # Generate enough to pick 100 later
    
    for uid in user_ids:
        base_emb = embeddings_map[uid]
        for _ in range(SAMPLES_PER_USER):
            noise = np.random.normal(0, 0.05, 128)
            diff = np.abs(base_emb - (base_emb + noise))
            X_list.append(diff); y_list.append(1)
            
        if len(user_ids) > 1:
            for _ in range(SAMPLES_PER_USER):
                other = embeddings_map[random.choice([u for u in user_ids if u != uid])]
                diff = np.abs(base_emb - (other + np.random.normal(0, 0.05, 128)))
                X_list.append(diff); y_list.append(0)
        else:
            for _ in range(SAMPLES_PER_USER):
                rand = np.random.normal(0, 1, 128)
                rand = rand / np.linalg.norm(rand)
                diff = np.abs(base_emb - rand)
                X_list.append(diff); y_list.append(0)

    return np.array(X_list), np.array(y_list)

def evaluate_model(model, X_test, y_test):
    # SVM predict returns the class directly (0 or 1)
    y_pred = model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    return {
        "accuracy": float(f"{accuracy:.4f}"),
        "precision": float(f"{precision:.4f}"),
        "recall": float(f"{recall:.4f}"),
        "f1_score": float(f"{f1:.4f}"),
        "confusion_matrix": {
            "true_positives": int(tp), "true_negatives": int(tn),
            "false_positives": int(fp), "false_negatives": int(fn)
        }
    }

def build_svm_model():
    """
    Builds a Support Vector Machine (SVM) classifier.
    kernel='rbf' is standard for non-linear data.
    probability=True allows us to get confidence scores later.
    """
    return SVC(kernel='rbf', C=1.0, gamma='scale', probability=True)

async def main():
    print("🚀 Starting Local Training (SVM MODEL)")
    print("=" * 60)

    X, y = [], []

    # --- STEP 1: TRY DATABASE ---
    print(f"🔌 Connecting to MongoDB at {settings.MONGODB_URL}...")
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        db_wrapper.client = client
        print("✅ Database Connected.")
        X, y = await fetch_db_data_augmented(client)
    except Exception as e:
        print(f"⚠️  DB Failed. Falling back to local file.")
        X, y = await fetch_local_data_augmented()

    if len(X) == 0:
        print("❌ No data found.")
        return

    # --- STEP 2: LIMIT TO EXACTLY 100 SAMPLES ---
    TARGET_SIZE = 100
    if len(X) > TARGET_SIZE:
        print(f"\n✂️  Reducing dataset from {len(X)} to {TARGET_SIZE} samples...")
        indices = np.arange(len(X))
        np.random.shuffle(indices)
        indices = indices[:TARGET_SIZE]
        X = X[indices]
        y = y[indices]

    print(f"📊 Final Dataset: {len(X)} samples (Pos: {np.sum(y==1)}, Neg: {np.sum(y==0)})")

    # --- STEP 3: TRAIN SVM ---
    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("\n🧠 Training SVM Model...")
        model = build_svm_model()
        model.fit(X_train, y_train)

        # Save as pickle (Standard for Scikit-Learn models)
        model_path = os.path.join(os.getcwd(), "app", "ml_models", "face_verifier_svm.pkl")
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
            
        print(f"💾 Model saved to: {model_path}")

        # Evaluate
        metrics = evaluate_model(model, X_test, y_test)

        print("\n✅ Training Completed Successfully!")
        print("=" * 60)
        print(f"📊 Accuracy:  {metrics['accuracy']:.4f}")
        print(f"📊 F1 Score:  {metrics['f1_score']:.4f}")
        print(f"📊 Precision: {metrics['precision']:.4f}")
        print(f"📊 Recall:    {metrics['recall']:.4f}")
        tn, fp, fn, tp = metrics['confusion_matrix']['true_negatives'], metrics['confusion_matrix']['false_positives'], metrics['confusion_matrix']['false_negatives'], metrics['confusion_matrix']['true_positives']
        print(f"Confusion Matrix: TP={tp}, TN={tn}, FP={fp}, FN={fn}")
        print(f"Split: {len(X_train)} Train / {len(X_test)} Test")

    except Exception as e:
        print(f"❌ Training Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())