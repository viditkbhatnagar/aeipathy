var express = require("express");
var router = express.Router();
var Blog = require("../models/blogs");
var middleware = require("../middleware");

//var dotnev = require('dotenv').config()
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'stryveir',
    api_key: 537774676813626,
    api_secret: "VG9a_Jc9EUJJUZ8WZV4d330Rrto"
});




//var mongoose = require('mongoose');
//var id = mongoose.Types.ObjectId('4edd40c86762e0fb12000003');
router.get("/", function(req, res) {
    //res.redirect("/blogs");
    res.render("landing");
});


router.get("/blogs", function(req, res) {
    var perPage = 30;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    Blog.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, blogs) {
        Blog.count().exec(function(err, count) {
            if (err) {
                console.log("ERROR!");
            } else {
                res.render("index", {
                    blogs: blogs,
                    current: pageNumber,
                    pages: Math.ceil(count / perPage)
                });
            }
        });
    });
});

//NEW ROUTE
router.get("/blogs/new", middleware.isLoggedIn, function(req, res) {
    res.render("new");
});

//SHOW-shows more information about the blog
router.get("/blogs/:id", function(req, res) {
    Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundBlog);
            res.render("show", { blog: foundBlog });
        }
    });
})


//CREATE ROUTE
router.post("/blogs", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
        // add cloudinary url for the image to the campground object under image property
        req.body.blog.image = result.secure_url;
        // add author to campground
        req.body.blog.author = {
            id: req.user._id,
            username: req.user.username
        }
        Blog.create(req.body.blog, function(err, blog) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect('/blogs/' + blog.id);
        });
    });
});
//router.post("/blogs", middleware.isLoggedIn, function(req, res) {
/* var title = req.body.title;
    var image = req.body.image;
    var body = req.body.body;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newBlog = { title: title, image: image, body: body, author: author };

    Blog.create(req.body.blog, function(err, newBlog) {
        if (err) {
            res.render("new");
        } else {
            console.log("newlyCreated");
            res.redirect("/blogs");
        }
    });
});*/


router.get("/blogs/:id", function(req, res) {
    Blog.findById(req.params.id, function(err, foundBlog) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("show", { blog: foundBlog });
        }
    })
});

//DELETE ROUTE
router.delete("/blogs/:id", middleware.checkBlogOwnership, function(req, res) {
    Blog.findByIdAndRemove(req.params.id, function(err) {
            if (err) {
                res.redirect("/blogs");
            } else {
                res.redirect("/blogs");
            }
        })
        //redirect somewhere
});



//EDIT ROUTE
router.get("/blogs/:id/edit", middleware.checkBlogOwnership, function(req, res) {
    // if (req.isAuthenticated()) {
    Blog.findById(req.params.id, function(err, foundBlog) {
        //       if (err) {
        //         res.redirect("/blogs");
        //   } else {
        //     if (foundBlog.author.id.equals = req.user._id) {
        res.render("edit", { blog: foundBlog });
        // } else {
        //       res.send("you do not have permsion");
        // }

        //            }
    });
});
//});


//UPDATE ROUTE
router.put("/blogs/:id", function(req, res) {

    req.body.blog.body = req.sanitize(req.body.blog.body)
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});




module.exports = router;