// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');



// const users = []; // In-memory user storage for simplicity

// // User registration
// app.post('/register', async (req, res) => {
//     const { username, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     users.push({ username, password: hashedPassword });
//     res.status(201).send('User registered');
// });

// // User login
// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;
//     const user = users.find(u => u.username === username);
//     if (user && await bcrypt.compare(password, user.password)) {
//         const token = jwt.sign({ username }, 'secret_key', { expiresIn: '1h' });
//         res.json({ token });
//     } else {
//         res.status(401).send('Invalid credentials');
//     }
// });

// // Protected route
// app.get('/protected', (req, res) => {
//     const authHeader = req.headers.authorization;
//     if (authHeader) {
//         const token = authHeader.split(' ')[1];
//         jwt.verify(token, 'secret_key', (err, user) => {
//             if (err) {
//                 return res.sendStatus(403);
//             }
//             res.send('Protected data');
//         });
//     } else {
//         res.sendStatus(401);
//     }
// });