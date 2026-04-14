import kagglehub
import os
import shutil

# Download dataset
path = kagglehub.dataset_download("ninzaami/loan-predication")

print("Downloaded at:", path)

# Move to your project data folder
DEST = "data/raw"

os.makedirs(DEST, exist_ok=True)

for file in os.listdir(path):
    shutil.copy(os.path.join(path, file), DEST)

print("Dataset moved to:", DEST)