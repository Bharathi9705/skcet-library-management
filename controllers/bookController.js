const { validationResult } = require('express-validator');
const Book = require('../models/Book');

exports.getBooks = async (req,res,next) => {
  try {
    const {page=1,limit=12,search='',department='',category='',available=''} = req.query;
    const data = await Book.getAll({page:+page,limit:+limit,search,department,category,available});
    res.json({success:true,...data});
  } catch(e){next(e);}
};

exports.getBook = async (req,res,next) => {
  try {
    const book = await Book.findById(req.params.id);
    if(!book) return res.status(404).json({success:false,message:'Book not found.'});
    res.json({success:true,book});
  } catch(e){next(e);}
};

exports.createBook = async (req,res,next) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({success:false,errors:errors.array()});
    const existing = await Book.findByISBN(req.body.isbn);
    if(existing) return res.status(409).json({success:false,message:'A book with this ISBN already exists.'});
    const id = await Book.create(req.body);
    const book = await Book.findById(id);
    res.status(201).json({success:true,message:'Book added successfully!',book});
  } catch(e){next(e);}
};

exports.updateBook = async (req,res,next) => {
  try {
    const book = await Book.findById(req.params.id);
    if(!book) return res.status(404).json({success:false,message:'Book not found.'});
    await Book.update(req.params.id,req.body);
    const updated = await Book.findById(req.params.id);
    res.json({success:true,message:'Book updated.',book:updated});
  } catch(e){next(e);}
};

exports.deleteBook = async (req,res,next) => {
  try {
    const book = await Book.findById(req.params.id);
    if(!book) return res.status(404).json({success:false,message:'Book not found.'});
    if(book.available_copies < book.total_copies)
      return res.status(409).json({success:false,message:'Cannot delete — copies are currently issued.'});
    await Book.delete(req.params.id);
    res.json({success:true,message:'Book deleted.'});
  } catch(e){next(e);}
};

exports.getDepartments = async (req,res,next) => {
  try {
    const departments = await Book.getDepartments();
    res.json({success:true,departments});
  } catch(e){next(e);}
};

exports.getCategories = async (req,res,next) => {
  try {
    const categories = await Book.getCategories(req.query.department||'');
    res.json({success:true,categories});
  } catch(e){next(e);}
};

exports.getStats = async (req,res,next) => {
  try {
    const stats = await Book.getStats();
    const popular = await Book.getPopular(5);
    res.json({success:true,stats,popular});
  } catch(e){next(e);}
};
