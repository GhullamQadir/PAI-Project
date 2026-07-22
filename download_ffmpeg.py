import urllib.request
import zipfile
import os
import shutil

url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
zip_path = "ffmpeg.zip"
bin_dir = "ffmpeg_bin"

print(f"Downloading FFmpeg from {url}...")
urllib.request.urlretrieve(url, zip_path)
print("Download complete. Extracting...")

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("ffmpeg_temp")

# Find the bin folder
extracted_folder = [f for f in os.listdir("ffmpeg_temp") if os.path.isdir(os.path.join("ffmpeg_temp", f))][0]
source_bin = os.path.join("ffmpeg_temp", extracted_folder, "bin")

if not os.path.exists(bin_dir):
    os.makedirs(bin_dir)

print("Copying executables...")
shutil.copy(os.path.join(source_bin, "ffmpeg.exe"), os.path.join(bin_dir, "ffmpeg.exe"))
shutil.copy(os.path.join(source_bin, "ffprobe.exe"), os.path.join(bin_dir, "ffprobe.exe"))

print("Cleaning up...")
os.remove(zip_path)
shutil.rmtree("ffmpeg_temp")

print("Done. FFmpeg installed in ffmpeg_bin directory.")
