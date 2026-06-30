const { validationResult } = require('express-validator');
const Issue = require('../models/Issue');
const Book  = require('../models/Book');
const User  = require('../models/User');
const Notification = require('../models/Notification');

exports.getIssues = async (req,res,next) => {
  try {
    const {page=1,limit=15,status='',search=''} = req.query;
    const user_id = req.user.role==='student' ? req.user.id : (req.query.user_id||'');
    const data = await Issue.getAll({page:+page,limit:+limit,status,user_id,search});
    res.json({success:true,...data});
  } catch(e){next(e);}
};

exports.getIssue = async (req,res,next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if(!issue) return res.status(404).json({success:false,message:'Issue not found.'});
    if(req.user.role==='student'&&issue.user_id!==req.user.id)
      return res.status(403).json({success:false,message:'Access denied.'});
    res.json({success:true,issue});
  } catch(e){next(e);}
};

exports.issueBook = async (req,res,next) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({success:false,errors:errors.array()});
    const {user_id,book_id,loan_days} = req.body;
    const [user,book] = await Promise.all([User.findById(user_id),Book.findById(book_id)]);
    if(!user) return res.status(404).json({success:false,message:'Student not found.'});
    if(!book) return res.status(404).json({success:false,message:'Book not found.'});
    if(book.available_copies<1) return res.status(409).json({success:false,message:'No copies available.'});
    const active = await Issue.findActive(user_id,book_id);
    if(active) return res.status(409).json({success:false,message:'This book is already issued to this student.'});
    const [id] = await Promise.all([
      Issue.create({user_id,book_id,issued_by:req.user.id,loan_days:loan_days||14}),
      Book.adjustAvailable(book_id,-1)
    ]);
    const issue = await Issue.findById(id);
    await Notification.create({user_id,title:'Book Issued',
      message:`"${book.title}" has been issued to you. Due date: ${issue.due_date}`,type:'success'});
    res.status(201).json({success:true,message:'Book issued successfully!',issue});
  } catch(e){next(e);}
};

exports.returnBook = async (req,res,next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if(!issue) return res.status(404).json({success:false,message:'Issue not found.'});
    if(issue.status==='returned') return res.status(409).json({success:false,message:'Already returned.'});
    const [result] = await Promise.all([
      Issue.returnBook(req.params.id,req.user.id),
      Book.adjustAvailable(issue.book_id,+1)
    ]);
    const msg = result.fine_amount>0
      ? `Book returned. Fine: ₹${result.fine_amount.toFixed(2)} (${result.days_late} day(s) late).`
      : 'Book returned on time. No fine!';
    if(result.fine_amount>0) {
      await Notification.create({user_id:issue.user_id,title:'Fine Charged',
        message:`Late return fine of ₹${result.fine_amount.toFixed(2)} charged for "${issue.book_title}".`,type:'warning'});
    }
    res.json({success:true,message:msg,issue:result});
  } catch(e){next(e);}
};

exports.payFine = async (req,res,next) => {
  try {
    await Issue.payFine(req.params.id);
    res.json({success:true,message:'Fine marked as paid.'});
  } catch(e){next(e);}
};

exports.getDashboardStats = async (req,res,next) => {
  try {
    const [issueStats,bookStats,userStats,recent,monthly] = await Promise.all([
      Issue.getStats(), Book.getStats(), User.getStats(),
      Issue.getRecent(8), Issue.getMonthlyStats()
    ]);
    res.json({success:true,stats:{issues:issueStats,books:bookStats,users:userStats},recent,monthly});
  } catch(e){next(e);}
};

exports.syncOverdue = async (req,res,next) => {
  try {
    const count = await Issue.syncOverdue();
    res.json({success:true,message:`${count} records updated to overdue.`});
  } catch(e){next(e);}
};
