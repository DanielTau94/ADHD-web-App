# ADHD-web-App
Final project for software engineering - ADHD web app for teachers to manage their classrooms/pupils.
1.	 Teacher Manual: Using the ADHD Management Web Application 
Before getting started, please ensure that your computer meets the following system requirements:
•	Operating System: Windows, macOS, or Linux
•	Visual Studio Code IDE installed (Download from: https://code.visualstudio.com/)
•	Node.js installed (Download from: https://nodejs.org/)
•	Internet connection
1.1.	Installation Steps
Open Visual Studio Code IDE on your computer.
Clone/Download as zip the ADHD Management Web Application repository from GitHub: [https://github.com/DanielTau94/ADHD-web-App].

 

Open the project folder in Visual Studio Code.
  

Open the integrated terminal in Visual Studio Code. You can do this by selecting View from the top menu and then choosing Terminal from the dropdown menu.
  
In the terminal, navigate to the project folder by using the cd command. For example:
 Install the required modules listed in the package.json file by running the following command:
 
After viewing the file, in the terminal start running the commands to install each module for e.g: npm install express@4.18.2 to download the specific version, or simply npm install express to download the default version.
Wait for the installation process to complete. This may take a few moments as the required modules are being downloaded and installed.
1.2.	Running the Web Application
Once all the modules have been successfully installed, you can run the web application by following these steps:
In the terminal, enter the following command:
  
The web application will start running, and you will see a message in the terminal indicating the server has started.
Open your web browser and enter the following URL: http://localhost:3000.
 
The ADHD Management Web Application will now be accessible in your web browser. 
1.3.	Connecting to the database:
Enter the following link to be redirected to mongoDB.
https://account.mongodb.com/account/login?n=%2Fv2%2F643a8a6d2398cb7c30430d04%23%2Fsecurity%2Fnetwork%2FaccessList

Login with Google (not email address) and enter the following credentials:
finalprojadhd2023@gmail.com User:
Password: Danieltau2023.

After connecting enter the Network Access section:
 
Add your current IP address by pressing “Add Current IP Address” to be granted access to the database. 

Then install MongoDB Compass
https://www.mongodb.com/try/download/shell

Open the mongoDB compass and enter the following:
 

That’s it! Now you can successfully login with your credentials.
