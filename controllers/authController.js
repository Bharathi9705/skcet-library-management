const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const sign = (id, role) => jwt.sign({id,role}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN||'7d'});

exports.register = async (req,res,next) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({success:false,errors:errors.array()});
    const {name,email,password,role,roll_number,department,phone} = req.body;
    const existing = await User.findByEmail(email);
    if(existing) return res.status(409).json({success:false,message:'Email already registered.'});
    if(role&&role!=='student'&&(!req.user||req.user.role!=='admin'))
      return res.status(403).json({success:false,message:'Only admin can create non-student accounts.'});
    const id = await User.create({name,email,password,role:role||'student',roll_number,department,phone});
    const user = await User.findById(id);
    const token = sign(id, user.role);
    res.status(201).json({success:true,message:'Account created.',token,user});
  } catch(e){next(e);}
};

exports.login = async (req,res,next) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({success:false,errors:errors.array()});
    const {email,password} = req.body;
    const user = await User.findByEmail(email);
    if(!user||!(await User.comparePassword(password,user.password)))
      return res.status(401).json({success:false,message:'Invalid email or password.'});
    if(!user.is_active)
      return res.status(403).json({success:false,message:'Account deactivated. Contact admin.'});
    const token = sign(user.id, user.role);
    const {password:_,...safe} = user;
    res.json({success:true,message:'Login successful.',token,user:safe});
  } catch(e){next(e);}
};

exports.getMe = async (req,res,next) => {
  try { res.json({success:true,user:req.user}); } catch(e){next(e);}
};

exports.changePassword = async (req,res,next) => {
  try {
    const {currentPassword,newPassword} = req.body;
    const user = await User.findByEmail(req.user.email);
    if(!(await User.comparePassword(currentPassword,user.password)))
      return res.status(400).json({success:false,message:'Current password incorrect.'});
    await User.changePassword(req.user.id,newPassword);
    res.json({success:true,message:'Password changed.'});
  } catch(e){next(e);}
};
