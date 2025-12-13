# 🕵️‍♂️ My Casper AI

> **A free, lightweight AI engine for IT professionals**  
> Built with Python, C++, and a touch of curiosity.

![Casper AI](https://via.placeholder.com/800x400/1e1e1e/00ffcc?text=Casper+AI+Demo) <!-- ganti nanti dengan screenshot -->

## 🌟 Features
- Real-time binary pattern analysis  
- Self-learning rule engine  
- Privacy-first design (no location tracking, no user data retention by default)  
- Each user sees **only their own history**  
- Admin access via password-only (simple & secure)

## ⚙️ Tech Stack
- **Backend**: Python 3.10+, Flask  
- **Performance**: C++ core module (`binary_scanner.cpp`)  
- **Frontend**: Vanilla JS + subtle dark theme  
- **Database**: SQLite (schema in `/db/schema.sql`)

## ▶️ How to Run Locally
```bash
git clone https://github.com/linuxku001-crypto/my-casper-ai.git
cd my-casper-ai

# Install dependencies
pip install -r requirements.txt

# Compile C++ module
chmod +x modules/build.sh
./modules/build.sh

# Run the app
python main.py
