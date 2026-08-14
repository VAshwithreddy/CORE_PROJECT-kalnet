import os
import glob
import re

frontend_dir = r"c:\Users\aagya\CORE_PROJECT-kalnet\frontend\src"

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            if "mock-db" in content or "mock-session" in content:
                print(f"Modifying {path}")
                
                # Replace imports
                content = re.sub(r'import\s+{[^}]+}\s+from\s+["\']@/lib/mock-db["\'];?', '', content)
                content = re.sub(r'import\s+{[^}]+}\s+from\s+["\']@/lib/mock-session["\'];?', 'import { useAuth } from "@/lib/auth";', content)

                # Replace usages (naively, just to make it compile for non-employee pages)
                content = content.replace('const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());', 'const { user: currentUser } = useAuth();')
                content = content.replace('const [currentUser, setCurrentUser] = useState(getCurrentUser());', 'const { user: currentUser } = useAuth();')
                content = content.replace('subscribeSession', '(() => {})')
                
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
