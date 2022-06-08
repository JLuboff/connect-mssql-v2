#!/bin/bash

# This script starts the mssql server locally. This assumes we are within a docker setup
# gitpod instance.
# NOTE: this is unstable and untested

systemctl start mssql-server
MSSQL_SA_PASSWORD="Password1!" MSSQL_PID=express /opt/mssql/bin/mssql-conf -n setup accept-eula


'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bash_profile \
'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc \
source ~/.bashrc