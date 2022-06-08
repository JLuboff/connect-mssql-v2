FROM gitpod/workspace-full

# Testing this build locally
# 1. docker build -f .gitpod.Dockerfile -t gitpod-dockerfile-test .
# 2. docker run -it gitpod-dockerfile-test bash
RUN wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
RUN sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2019.list)"
RUN sudo apt-get update \
 && sudo apt-get install -y mssql-server

# installation steps
# taken from (example uses redhat):
# https://docs.microsoft.com/en-us/sql/linux/sample-unattended-install-redhat?view=sql-server-ver16
# RUN sudo systemctl start mssql-server
# RUN sudo MSSQL_SA_PASSWORD=Password1! \
#   MSSQL_PID=express \
#   /opt/mssql/bin/mssql-conf -n setup accept-eula

# RUN echo PATH="$PATH:/opt/mssql-tools/bin" >> ~/.bash_profile \
#   && echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc \
#   && source ~/.bashrc
