FROM gitpod/workspace-full

RUN wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
RUN sudo apt-get update \
 && sudo apt-get install -y mssql-server \
 && sudo apt-get clean

# Installation and setup commands go here!