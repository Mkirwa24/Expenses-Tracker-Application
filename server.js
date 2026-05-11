const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const authenticateToken = require('./middleware/authenticateToken');
const db = require('./db'); // Import the database using pooled connection
const addExpenseRoute = require('./routes/add_expense');
const viewExpenseRoutes = require('./routes/view_expense');
const editExpenseRoutes = require('./routes/edit_expense'); // Import edit expense routes
const deleteExpenseRoutes = require('./routes/delete_expense'); // Import delete expense routes
const totalExpenseRoutes = require('./routes/totalexpense'); // Import total expenses routes
const chartRoutes = require('./routes/charts'); // Import chart routes
const logoutRoute = require('./routes/logout');
const forgotPasswordRoutes = require('./routes/forgot-password')
const resetPasswordRoutes = require('./routes/reset-password')

dotenv.config();
app.use(express.json());
app.use(cors());
// Update this line to configure CORS
const frontendURL = 'https://expenses-tracking-application1.netlify.app'; // your actual front-end URL goes here
app.use(cors({
    origin: frontendURL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],   // Specify allowed HTTP methods
    credentials: true // Allow credentials if needed (cookies, etc.)
}));



app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Assuming 'public' is the folder where your HTML file is located
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

     // Create Users table
     const createUsersTable = `
     CREATE TABLE IF NOT EXISTS users (
         id INT AUTO_INCREMENT PRIMARY KEY,
         email VARCHAR(100) NOT NULL UNIQUE,
         username VARCHAR(255) NOT NULL UNIQUE,
         password VARCHAR(255) NOT NULL,
         securityQuestion VARCHAR(255),
         securityAnswerHash VARCHAR(255),
         resetToken VARCHAR(255),       
         resetTokenExpiry BIGINT,
         resetAttempts INT DEFAULT 0,
         lastAttempt DATETIME       
         )
 `;
 db.query(createUsersTable, (err) => {
     if (err) {
         console.error('Error creating Users table:', err);
         return;
     }
     console.log('Users table created or already exists.');
 });

 // Create Expenses table
 const createExpensesTable = `
     CREATE TABLE IF NOT EXISTS expenses (
         id INT AUTO_INCREMENT PRIMARY KEY,
         user_id INT,
         name VARCHAR(255) NOT NULL,
         amount DECIMAL(10, 2) NOT NULL,
         date DATE NOT NULL,
         category VARCHAR(255) NOT NULL,
         FOREIGN KEY (user_id) REFERENCES users(id)
     )
 `;
 db.query(createExpensesTable, (err) => {
     if (err) {
         console.error('Error creating Expenses table:', err);
         return;
     }
     console.log('Expenses table created or already exists.');
 });

 // Function to hash security answer
const hashSecurityAnswer = async (answer) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(answer, salt);
};
// User registration route
app.post('/api/register', async (req, res) => {
    const { securityQuestion, securityAnswer } = req.body;
    try {
        const usersQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
        db.query(usersQuery, [req.body.email, req.body.username], async (err, data) => {
            if (err) return res.status(500).json('Something went wrong: ' + err.message);
            if (data.length > 0) return res.status(409).json({ message:'User already exists' });
            
            // Hash the password
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
 
            // Hash the security answer
            const hashedSecurityAnswer = await hashSecurityAnswer(securityAnswer);
           
            const createUserQuery = 'INSERT INTO users(email, username, password, securityQuestion, securityAnswerHash) VALUES(?, ?, ?, ?, ?)';
            const values = [
                req.body.email,
                req.body.username,
                hashedPassword,
                securityQuestion,
                hashedSecurityAnswer
            ];

            // Insert user in db
            db.query(createUserQuery, values, (err) => {
                if (err) return res.status(500).json('Something went wrong');
                return res.status(200).json('User created successfully');
            });
        });
    } catch (err) {
        res.status(500).json('Internal Server Error');
    }
});

// User login route
app.post('/api/login', async (req, res) => {
    try {
        const usersQuery = 'SELECT * FROM users WHERE username = ?';
        db.query(usersQuery, [req.body.username], async (err, data) => {
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).json('Something went wrong: ' + err.message);
            }
            if (data.length === 0) {
                return res.status(404).json('User not found');
            }

            // Check if password is valid
            const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password);
            if (!isPasswordValid) {
                return res.status(400).json('Invalid email or password');
            }

            // Generate a token
            const user = { id: data[0].id, username: data[0].username };
            console.log('User for token:', user); // Debug log
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
            console.log('Generated access token:', accessToken); // Debug log
            res.status(200).json({ message: 'Login Successful', accessToken });
        });
    } catch (err) {
        console.error('Internal Server Error:', err.message);
        res.status(500).json('Internal Server Error');
    }
});

// Route to refresh access token
app.post('/refreshToken', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json('Refresh token is required');
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.error('Invalid refresh token:', err); // Detailed error log
            return res.status(403).json('Invalid refresh token');
        }

        const newAccessToken = jwt.sign({ id: user.id, username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });

        res.json({ accessToken: newAccessToken });
    });
});

// Integrate routes with authentication middleware
app.use('/add_expense', authenticateToken, addExpenseRoute);
app.use('/view_expense', authenticateToken, viewExpenseRoutes);
app.use('/edit_expense', authenticateToken, editExpenseRoutes); // Add route integration for editing expenses
app.use('/delete_expense', authenticateToken, deleteExpenseRoutes); // Add route integration for deleting expenses
app.use('/totalexpenses', authenticateToken,  totalExpenseRoutes); // Add route integration for total expense
app.use('/charts', authenticateToken, chartRoutes); // Add route integration for charts
app.use('/logout', logoutRoute);
app.use('/forgot-password', forgotPasswordRoutes);
app.use('/reset-password', resetPasswordRoutes);


// Start the server
// Use Render's provided port or default to 5200
const PORT = process.env.PORT || 5200;  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
