
#!/bin/sh
set -e

echo "Checking Keycloak database..."

if ! psql \
    -v ON_ERROR_STOP=1 \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    -tAc "SELECT 1 FROM pg_database WHERE datname = 'keycloak_db'" \
    | grep -q 1
then
    echo "Creating keycloak_db..."
    psql \
        -v ON_ERROR_STOP=1 \
        --username "$POSTGRES_USER" \
        --dbname "$POSTGRES_DB" \
        -c "CREATE DATABASE keycloak_db OWNER \"$POSTGRES_USER\";"
else
    echo "keycloak_db already exists."
fi

echo "Keycloak database initialization completed."
