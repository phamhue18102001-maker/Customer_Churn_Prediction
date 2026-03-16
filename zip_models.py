import zipfile
import os

folder_to_zip = "models"
zip_name = "models.zip"

with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(folder_to_zip):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, start=".")
            zipf.write(file_path, arcname)

print("✅ Đã tạo file models.zip thành công!")