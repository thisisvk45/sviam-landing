"""One-time cleanup script: delete ALL users and their data."""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(url, key)

users_response = supabase.auth.admin.list_users()
users = users_response if isinstance(users_response, list) else getattr(users_response, "users", users_response)

print(f"Found {len(users)} users to delete\n")

for i, user in enumerate(users, 1):
    uid = str(user.id)
    email = getattr(user, "email", uid)
    print(f"[{i}/{len(users)}] Deleting user {email} ({uid})")

    # 1. applications
    try:
        supabase.table("applications").delete().eq("user_id", uid).execute()
        print("  - applications deleted")
    except Exception as e:
        print(f"  - applications error: {e}")

    # 2. saved_jobs
    try:
        supabase.table("saved_jobs").delete().eq("user_id", uid).execute()
        print("  - saved_jobs deleted")
    except Exception as e:
        print(f"  - saved_jobs error: {e}")

    # 3. user_resumes
    try:
        supabase.table("user_resumes").delete().eq("user_id", uid).execute()
        print("  - user_resumes deleted")
    except Exception as e:
        print(f"  - user_resumes error: {e}")

    # 4. profiles
    try:
        supabase.table("profiles").delete().eq("user_id", uid).execute()
        print("  - profiles deleted")
    except Exception as e:
        print(f"  - profiles error: {e}")

    # 5. storage files
    try:
        files = supabase.storage.from_("resumes").list(uid)
        if files:
            paths = [f"{uid}/{f['name']}" for f in files]
            supabase.storage.from_("resumes").remove(paths)
            print(f"  - storage: removed {len(paths)} files")
        else:
            print("  - storage: no files")
    except Exception as e:
        print(f"  - storage error: {e}")

    # 6. auth user
    try:
        supabase.auth.admin.delete_user(uid)
        print("  - auth user deleted")
    except Exception as e:
        print(f"  - auth delete error: {e}")

    print()

print("Done.")
