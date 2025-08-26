#!/usr/bin/env python3
from supabase_utils import SupabaseClient
import json
import sys

def get_supabase_info(command, table_name=None):
    """
    Get information from Supabase based on command
    
    Args:
        command: The command to execute (list_tables, table_schema, query)
        table_name: Optional table name for schema or query commands
        
    Returns:
        JSON string with the results
    """
    try:
        # Initialize client using config file
        client = SupabaseClient(config_file='supabase_config.json')
        
        if command == 'list_tables':
            tables = client.list_tables()
            return json.dumps({
                "status": "success",
                "tables": tables
            }, indent=2)
            
        elif command == 'table_schema' and table_name:
            schema = client.get_table_schema(table_name)
            return json.dumps({
                "status": "success",
                "schema": schema
            }, indent=2)
            
        elif command == 'query' and table_name:
            # Using anon key for safety and limiting to 5 rows
            data = client.query_table(table_name, limit=5, use_service_role=False)
            return json.dumps({
                "status": "success",
                "data": data
            }, indent=2)
            
        else:
            return json.dumps({
                "status": "error",
                "message": "Invalid command or missing table name"
            }, indent=2)
            
    except Exception as e:
        return json.dumps({
            "status": "error",
            "message": str(e)
        }, indent=2)

def main():
    """
    Main function to handle command line arguments
    """
    if len(sys.argv) < 2:
        print("Usage: python claude_integration_example.py <command> [table_name]")
        print("Commands: list_tables, table_schema, query")
        sys.exit(1)
    
    command = sys.argv[1]
    table_name = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = get_supabase_info(command, table_name)
    print(result)

if __name__ == "__main__":
    main()

# Example of how to use this with Claude or other AI tools:
"""
import subprocess
import json

def ask_claude_about_database():
    # First, get the list of tables
    result = subprocess.run(
        ['python', 'claude_integration_example.py', 'list_tables'], 
        capture_output=True, 
        text=True
    )
    
    tables_info = json.loads(result.stdout)
    
    if tables_info['status'] == 'success':
        # Now get schema for a specific table
        table_name = tables_info['tables'][0]  # Get first table
        result = subprocess.run(
            ['python', 'claude_integration_example.py', 'table_schema', table_name], 
            capture_output=True, 
            text=True
        )
        
        schema_info = json.loads(result.stdout)
        
        # Now you can send this information to Claude
        claude_prompt = f'''
        Here is information about my database:
        
        Tables: {tables_info['tables']}
        
        Schema for {table_name}:
        {json.dumps(schema_info['schema'], indent=2)}
        
        Can you help me understand this database structure?
        '''
        
        # Send prompt to Claude...
        
# To call this from Claude:
# 1. Claude would execute the script with appropriate arguments
# 2. Parse the JSON response
# 3. Use the information in its response
"""






