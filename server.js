require('dotenv').config();
const express   = require('express');
const path      = require('path');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({contentSecurityPolicy:false}));
app.use(cors());
app.use(morgan(process.env.NODE_ENV==='production'?'combined':'dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use('/api/', rateLimit({windowMs:15*60*1000,max:500,standardHeaders:true,legacyHeaders:false}));
app.use(express.static(path.join(__dirname,'public')));

app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/books',         require('./routes/bookRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/issues',        require('./routes/issueRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/api/health', (_,res) => res.json({success:true,message:'SKCET Library API v4'}));
app.get('*', (_,res) => res.sendFile(path.join(__dirname,'public','index.html')));

const {notFound,errorHandler} = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀  SKCET Library v4 → http://localhost:${PORT}\n`);
});
module.exports = app;
