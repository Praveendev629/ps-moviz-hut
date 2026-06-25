import os
import zipfile

def package_project():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    zip_name = os.path.join(os.path.dirname(project_dir), 'ps-moviz-hut.zip')
    
    # Files and folders to include
    files_to_zip = [
        'vercel.json',
        'requirements.txt',
        'README.md',
        'api/index.py',
        'api/build_db.py',
        'api/movies_db.json',
        'public/index.html',
        'public/style.css',
        'public/app.js',
        'public/assets/intro.mp4',
        'public/assets/logo.png'
    ]
    
    print(f"Creating zip archive at: {zip_name}...")
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for rel_path in files_to_zip:
            full_path = os.path.join(project_dir, rel_path.replace('/', os.sep))
            if os.path.exists(full_path):
                print(f"  Adding {rel_path}...")
                # Write file with relative path in archive
                zipf.write(full_path, rel_path)
            else:
                print(f"  Warning: File not found {rel_path}")
                
    print(f"Project successfully zipped! Size: {os.path.getsize(zip_name) / (1024*1024):.2f} MB")

if __name__ == '__main__':
    package_project()
