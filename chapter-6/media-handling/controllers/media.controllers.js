const imagekit = require('../libs/imagekit');
const path = require('path');
const qr = require('qr-image');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
    singleUpload: (req, res) => {
        let folder = req.file.destination.split('public/')[1];
        const fileUrl = `${req.protocol}://${req.get('host')}/${folder}/${req.file.filename}`;

        return res.json({
            status: true,
            message: 'OK',
            error: null,
            data: { file_url: fileUrl }
        });
    },

    multiUpload: (req, res) => {
        let fileUrls = [];
        req.files.forEach(file => {
            let folder = file.destination.split('public/')[1];
            const fileUrl = `${req.protocol}://${req.get('host')}/${folder}/${file.filename}`;
            fileUrls.push(fileUrl);
        });

        return res.json({
            status: true,
            message: 'OK',
            error: null,
            data: { file_urls: fileUrls }
        });
    },


    imagekit: async (req, res, next) => {
        try {
            // contoh baca dari request multipart
            let { first_name, last_name } = req.body;

            let strFile = req.file.buffer.toString('base64');

            let { url } = await imagekit.upload({
                fileName: Date.now() + path.extname(req.file.originalname),
                file: strFile
            });

            return res.json({
                status: true,
                message: 'OK',
                error: null,
                data: { file_url: url, first_name, last_name } // cek data dari request
            });
        } catch (err) {
            next(err);
        }
    },

    generateQrCode: async (req, res, next) => {
        try {
            let { qr_data } = req.body;
            if (!qr_data) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    error: 'qr_data is required!',
                    data: null
                });
            }

            let qrPng = qr.imageSync(qr_data, { type: 'png' });
            let { url } = await imagekit.upload({
                fileName: Date.now() + '.png',
                file: qrPng.toString('base64')
            });

            return res.json({
                status: true,
                message: 'OK',
                error: null,
                data: { qr_code_url: url }
            });
        } catch (err) {
            next(err);
        }
    },

    //register
    register: async (req, res, next) => {
        try {
            let { email, password, password_confirmation, profile } = req.body;
            if (password != password_confirmation) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'please ensure that the password and password confirmation match!',
                    data: null
                });
            }

            let userExist = await prisma.users.findUnique({ where: { email } });
            if (userExist) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'user has already been used!',
                    data: null
                });
            }


                  let encryptedPassword = await bcrypt.hash(password, 10);
                  let users = await prisma.users.create({
                    data: {
                      email,
                      password: encryptedPassword,
                      profile: {
                        create: profile,
                      },
                    },
                  });

            return res.status(201).json({
                status: true,
                message: 'Created',
                err: null,
                data: { users }
            });
        } catch (err) {
            next(err);
        }
    },

    //login
    login: async (req, res, next) => {
        try {
            let { email, password } = req.body;

            let users = await prisma.users.findUnique({ where: { email } });
            if (!users) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'invalid email or password!',
                    data: null
                });
            }

            let isPasswordCorrect = await bcrypt.compare(password, users.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'invalid email or password!',
                    data: null
                });
            }

            let token = jwt.sign({ id: users.id }, JWT_SECRET_KEY);

            return res.status(200).json({
                status: true,
                message: 'OK',
                err: null,
                data: { users, token }
            });
        } catch (err) {
            next(err);

        }
    },
    
    //whoami, 
    whoami: (req, res, next) => {
        return res.status(200).json({
            status: true,
            message: 'OK',
            err: null,
            data: { users: req.users,  userprofile : req.userprofile}
        });
    },

    //update profil, disini saya belum bisa memasukkan database pada property profil_picture karena masih bingung, saya memberi pada database dengan tipe string berupa url foto nantinya. namun masih gagal
    updateprofil: async (req, res, next) => {
        try {
            let { user_id, first_name, last_name, birth_date, profile_picture} = req.body;

            await prisma.userprofile.update({
                where: {
                    user_id: Number(req.params.user_id) // Gunakan ID yang sesuai dari req.body
                },
                data: {
                    first_name, last_name, birth_date, profile_picture
                }
            });

            let strFile = req.file.buffer.toString('base64');

            let { url } = await imagekit.upload({
                fileName: Date.now() + path.extname(req.file.originalname),
                file: strFile
            });

            return res.status(200).json({
                status: true,
                message: 'OK',
                err: null,
                data: { profile_picture : url, first_name, last_name, birth_date}
            });
        } catch (err) {
            next(err);

        }
    },

};