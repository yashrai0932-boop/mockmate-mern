import sys
import pymysql

def create_database(host, user, password, db_name):
    try:
        conn = pymysql.connect(host=host, user=user, password=password)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        print(f"✅ Database '{db_name}' created successfully or already exists!")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error connecting to MySQL: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    host = "localhost"
    user = "root"
    db_name = "mockmate"
    password = sys.argv[1] if len(sys.argv) > 1 else ""
    
    if not create_database(host, user, password, db_name):
        print("\nIf you have a password set for root, please run:")
        print("  .\\venv_win\\Scripts\\python.exe create_db.py <your_mysql_root_password>")
