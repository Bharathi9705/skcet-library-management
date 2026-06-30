const { validationResult } = require('express-validator');
const User  = require('../models/User');

exports.getUsers = async (req,res,next) => {
  try {
    const {page=1,limit=15,role='',search=''} = req.query;
    const data = await User.getAll({page:+page,limit:+limit,role,search});
    res.json({success:true,...data});
  } catch(e){next(e);}
};

exports.getUser = async (req,res,next) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({success:false,message:'User not found.'});
    res.json({success:true,user});
  } catch(e){next(e);}
};

exports.getUserIssues = async (req,res,next) => {
  try {
    if(req.user.role==='student'&&req.user.id!==+req.params.id)
      return res.status(403).json({success:false,message:'Access denied.'});
    const issues = await User.getIssues(req.params.id);
    res.json({success:true,issues});
  } catch(e){next(e);}
};

exports.updateUser = async (req,res,next) => {
  try {
    if(req.user.role==='student'&&req.user.id!==+req.params.id)
      return res.status(403).json({success:false,message:'Access denied.'});
    if(req.body.role&&req.user.role!=='admin') delete req.body.role;
    await User.update(req.params.id,req.body);
    const user = await User.findById(req.params.id);
    res.json({success:true,message:'User updated.',user});
  } catch(e){next(e);}
};

exports.deleteUser = async (req,res,next) => {
  try {
    if(+req.params.id===req.user.id)
      return res.status(400).json({success:false,message:'Cannot deactivate your own account.'});
    await User.delete(req.params.id);
    res.json({success:true,message:'User deactivated.'});
  } catch(e){next(e);}
};

exports.getStats = async (req,res,next) => {
  try {
    const stats = await User.getStats();
    res.json({success:true,stats});
  } catch(e){next(e);}
};
