# Supabase Database Tools

This collection of Python scripts allows you to easily interact with your Supabase database. The tools are designed to be simple to use and can be integrated with Claude or other AI tools.

## Files

- `supabase_utils.py` - The main utility class for interacting with Supabase
- `supabase_config.json` - Configuration file with your Supabase credentials
- `list_tables_example.py` - Example script showing how to list tables and query data
- `claude_integration_example.py` - Example showing how to integrate with Claude or other AI tools

## Requirements

- Python 3.6+
- `requests` library (`pip install requests`)

## Usage

### Basic Usage

```bash
# List all tables in the database
python list_tables_example.py

# Or use the utility directly
python supabase_utils.py --config supabase_config.json --action list-tables

# Get schema for a specific table
python supabase_utils.py --config supabase_config.json --action table-schema --table users

# Query data from a table
python supabase_utils.py --config supabase_config.json --action query --table users --limit 10
```

### Integration with Claude or Other AI Tools

The `claude_integration_example.py` script is designed to be called by Claude or other AI tools to get information about your database.

```bash
# List all tables
python claude_integration_example.py list_tables

# Get schema for a specific table
python claude_integration_example.py table_schema users

# Query data from a table (limited to 5 rows)
python claude_integration_example.py query users
```

### Using in Your Own Scripts

```python
from supabase_utils import SupabaseClient

# Initialize client using config file
client = SupabaseClient(config_file='supabase_config.json')

# Or initialize with direct credentials
client = SupabaseClient(
    url="https://your-project-ref.supabase.co",
    anon_key="your-anon-key",
    service_role_key="your-service-role-key"
)

# List all tables
tables = client.list_tables()

# Get schema for a table
schema = client.get_table_schema("users")

# Query data from a table
data = client.query_table("users", limit=10)
```

## Security Notes

- The `supabase_config.json` file contains sensitive credentials. Do not commit it to version control.
- By default, queries use the anon key for safety. Use `use_service_role=True` only when necessary.
- Consider using environment variables instead of a config file for production use.

## Customizing

You can extend the `SupabaseClient` class to add more functionality as needed, such as:

- Insert, update, and delete operations
- RPC function calls
- Authentication and user management
- Real-time subscriptions

Refer to the [Supabase documentation](https://supabase.io/docs) for more information on the available APIs.






