# Make Academia Interesting



## Installation Process for Linux

### Install Node.js and NPM
```
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm

```

### Install MySql

#### Step1
```
sudo apt-get update
sudo apt-get install mysql-server
mysql_secure_installation
```


#### Verify

```
systemctl status mysql.service
```
 
Output should be

```
● mysql.service - MySQL Community Server
   Loaded: loaded (/lib/systemd/system/mysql.service; enabled; vendor preset: en
   Active: active (running) since Wed 2016-11-23 21:21:25 UTC; 30min ago
 Main PID: 3754 (mysqld)
    Tasks: 28
   Memory: 142.3M
      CPU: 1.994s
   CGroup: /system.slice/mysql.service
           └─3754 /usr/sbin/mysqld
``` 
### Install Dependencies
```
sudo npm install --save
```


### Run Server

Run the following command
```
npm start
```

### Run SQL Scipt
```
source path_to_file.sql
```




Then open [http://localhost:3000/](http://localhost:3000/) to see your app
