# 📂 S3 Bucket Folder Structure Guide

## 🎯 Your Current Bucket

**Bucket Name:** `cloudbackuprecovery-simple-001961766026-20260505`

**Region:** `ap-south-1`

---

## 📁 Folder Structure Explained

```
cloudbackuprecovery-simple-001961766026-20260505/
│
├── 📂 users/
│   └── {USER_ID}/
│       └── files/
│           ├── test-file.txt (v1) ← USER UPLOADED FILES
│           ├── test-file.txt (v2)
│           ├── test-file.txt (v3)
│           ├── document.pdf
│           └── ...more files
│
├── 📂 system-backups/
│   ├── backup-2026-05-05-01-00.tar.gz ← SYSTEM/DATABASE BACKUPS
│   ├── backup-2026-05-06-01-00.tar.gz
│   └── ...scheduled backups
│
└── 📄 Sample Files (root level)
    └── 1772174032494-WJAETS-2025-0587.pdf ← DEMO FILE
```

---

## 🎯 Which Folder to Use & When

### **For User File Uploads ✅ (Use This One!)**

```
users/{USER_ID}/files/{FILENAME}
```

**Example:**
```
users/69fa09a836b2ac3ba15df009/files/test-file.txt
users/69fa09a836b2ac3ba15df009/files/document.pdf
users/69fa09a836b2ac3ba15df009/files/presentation.pptx
```

**When:** Every time a user uploads a file through the app
- ✅ Used by: `/api/files/upload` endpoint
- ✅ Stored in: Database with reference to S3 key
- ✅ Shows: User's personal files
- ✅ Versioned: Yes (S3 versioning tracks all versions)

### **For System/Database Backups** 🔄 (Auto-managed)

```
system-backups/{BACKUP_FILENAME}
```

**Example:**
```
system-backups/backup-2026-05-05-01-00.tar.gz
system-backups/backup-2026-05-06-01-00.tar.gz
system-backups/daily-backup-20260505.tar
```

**When:** Automatic scheduled backups (cron job)
- ℹ️ Used by: Cron service (runs daily at 1 AM UTC)
- ℹ️ Stored in: System folder (not per-user)
- ℹ️ Shows: Database backup history
- ℹ️ Configured: BACKUP_CRON_SCHEDULE=0 1 * * *

---

## 💡 Which Folder to Show to Prove Files Are Uploaded?

### **✅ Use the `users/` folder**

This is the folder you should check to demonstrate that file uploads are working:

```bash
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/users/ --recursive
```

---

## 📊 Current Bucket Status

### What's Currently Stored

```
Total Objects: 2
Total Size: 495.9 KiB

1. 📄 1772174032494-WJAETS-2025-0587 backup and disaster recovery.pdf
   └─ Location: Root (demo file)
   └─ Size: 495.8 KiB
   └─ Purpose: Sample/Demo

2. 📄 test-file.txt
   └─ Location: users/69fa09a836b2ac3ba15df009/files/
   └─ Size: 52 Bytes
   └─ Purpose: Test file (from your earlier tests)
   └─ Versions: 3 versions (v1, v2, restored)
```

---

## 🔍 How to Check File Uploads

### Option 1: List User Files (Recommended)
```bash
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/users/ --recursive --human-readable
```

**Output shows:**
```
2026-05-05 20:47:31       52 Bytes users/69fa09a836b2ac3ba15df009/files/test-file.txt
```

### Option 2: List All S3 Objects
```bash
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/ --recursive --human-readable --summarize
```

### Option 3: List Specific User's Files
```bash
# Replace USER_ID with actual ID (e.g., 69fa09a836b2ac3ba15df009)
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/users/{USER_ID}/files/ --recursive
```

### Option 4: View S3 Version History (Proves Versioning)
```bash
aws s3api list-object-versions \
  --bucket cloudbackuprecovery-simple-001961766026-20260505 \
  --prefix "users/" \
  --output table
```

---

## 🗂️ Folder Purpose Summary

| Folder | Purpose | Who Creates | When | Shows |
|--------|---------|------------|------|-------|
| **users/** | User file uploads | User via app | When uploading files | ✅ Proof of file uploads |
| **users/{ID}/files/** | Individual user's files | User via app | Every upload | ✅ User's uploaded files |
| **system-backups/** | System database backups | Cron job (auto) | Daily at 1 AM UTC | Database backup history |
| **root level** | Demo/sample files | Manual upload | One-time setup | Sample files |

---

## ✅ To Demonstrate File Uploads to Others

### Show This Command:
```bash
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/users/ --recursive --human-readable --summarize
```

### Expected Output (Proof):
```
2026-05-05 20:47:31       52 Bytes users/69fa09a836b2ac3ba15df009/files/test-file.txt
2026-05-05 20:48:15       68 Bytes users/69fa09a836b2ac3ba15df009/files/test-file.txt
2026-05-05 20:49:22       52 Bytes users/69fa09a836b2ac3ba15df009/files/test-file.txt

Total Objects: 3
   Total Size: 172 Bytes
```

This shows:
- ✅ Files are actually uploaded to S3
- ✅ Multiple versions are created and stored
- ✅ Files are organized per user
- ✅ Timestamps prove when uploaded

---

## 🎯 Quick Action: Upload & Verify

### Step 1: Upload a file through the web app
```
http://ab9f32fec276d450a9724384147bcd81-1415855032.ap-south-1.elb.amazonaws.com:8080
→ Login → Upload a file
```

### Step 2: Check S3 immediately after
```bash
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/users/ --recursive
```

### Step 3: Verify in AWS Console
Go to: AWS S3 → cloudbackuprecovery-simple-001961766026-20260505 → users/ folder

---

## 📝 Code References

### Where folders are configured in code:

**File path:** `backend/services/s3Service.js`

```javascript
// User files folder structure
const buildUserFileKey = (userId, originalName) => 
  `users/${userId}/files/${sanitizeFileName(originalName)}`;

// System backups folder structure
const buildDatabaseBackupKey = (fileName) => 
  `system-backups/${fileName}`;
```

---

## 🎓 Summary

**To show that files are being uploaded:**

```bash
# Simple, clear command
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/users/ --recursive --human-readable

# With summary
aws s3 ls s3://cloudbackuprecovery-simple-001961766026-20260505/users/ --recursive --human-readable --summarize
```

**Files will appear in:** `users/{USER_ID}/files/{FILENAME}`

**This proves:**
- ✅ Files are uploaded from the web app
- ✅ They're stored in S3
- ✅ They're organized by user
- ✅ Versions are tracked

---

**Use the `users/` folder to demonstrate file uploads!** 🎯
