# Create the file and add content
@"
#!/bin/bash
cd frontend
npm install
npm run build
# Copy build files to where Vercel expects them
cp -r build/* ../public/
"@ | Out-File -FilePath "vercel-build.sh" -Encoding UTF8