#!/bin/bash

urlencode() {
    # Define a string with the characters to be encoded
    string="$1"
    encoded=""
    
    # Loop through each character in the string
    for ((i=0; i<${#string}; i++)); do
        char="${string:$i:1}"
        # Check if the character is alphanumeric or one of the special characters
        if [[ "$char" =~ [a-zA-Z0-9\.\_\~\-] ]]; then
            encoded+="$char" # No encoding required
        else
            # Encode non-alphanumeric characters using printf
            printf -v hex '%02x' "'$char" # Get the hex value of the character
            encoded+="%"$hex # Append % followed by the hex value
        fi
    done
    
    echo "$encoded"
}
encoded_user=$(urlencode $POSTGRESQL_USER)
encoded_password=$(urlencode $POSTGRESQL_PASSWORD)
export DATABASE_URL=postgresql://$encoded_user:$encoded_password@$POSTGRESQL_HOST:$POSTGRESQL_PORT/$POSTGRESQL_DB

yarn prisma migrate dev --create-only --name ${1}