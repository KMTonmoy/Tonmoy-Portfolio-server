const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const port = process.env.PORT;
const jwt = require("jsonwebtoken");

app.use(
    cors({
        origin: ["http://localhost:3000", "https://tonmoy-portfolio-client.vercel.app"],
        credentials: true,
    })
);

app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        console.log("Connected to MongoDB");

        const usersCollection = client.db("Tonmoy").collection("users");
        const projectsCollection = client.db("Tonmoy").collection("projects");
        const blogsCollection = client.db("Tonmoy").collection("blogs");
        const messageCollection = client.db("Tonmoy").collection("message");


        app.post("/register", async (req, res) => {
            const { username, email, password } = req.body;

            // Check if email already exists
            const existingUser = await usersCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User already exist!!!",
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await usersCollection.insertOne({
                username,
                email,
                password: hashedPassword,
                role: "user",
            });

            res.status(201).json({
                success: true,
                message: "User registered successfully!",
            });
        });

        app.post("/login", async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await usersCollection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Generate JWT token
            const token = jwt.sign(
                { email: user.email, role: user.role },
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.EXPIRES_IN,
                }
            );

            res.json({
                success: true,
                message: "User successfully logged in!",
                accessToken: token,
            });
        });


        app.get("/users", async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        });


        app.get("/blogs", async (req, res) => {
            const blogs = await blogsCollection.find().toArray();
            res.send(blogs);
        });
        app.get("/blogs/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const blogs = await blogsCollection.findOne(query);
            res.send(blogs);
        });

        app.delete("/blogs/:id", async (req, res) => {
            const { id } = req.params;
            try {
                const query = { _id: new ObjectId(id) };
                const result = await blogsCollection.deleteOne(query);
                if (result.deletedCount === 1) {
                    res.send({ success: true, message: "Blog deleted successfully" });
                } else {
                    res.status(404).send({ success: false, message: "Blog not found" });
                }
            } catch (error) {
                res.status(500).send({ success: false, message: "Error deleting blog", error });
            }
        });


        app.put("/blogs/:id", async (req, res) => {
            const { id } = req.params;
            const updateBlog = req.body;

            delete updateBlog._id;

            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: updateBlog,
            };

            try {
                const result = await blogsCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error updating Blogs", error });
            }
        });


        app.post("/blogPost", async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        });



        app.get("/projects", async (req, res) => {
            const projects = await projectsCollection.find().toArray();
            res.send(projects);
        });
        app.get("/projects/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const project = await projectsCollection.findOne(query);
            res.send(project);
        });

        app.post("/projects", async (req, res) => {
            const projects = req.body;
            const result = await projectsCollection.insertOne(projects);
            res.send(result);
        });

        app.delete("/projects/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await projectsCollection.deleteOne(query);
            res.send(result);
        });

        app.put("/projectsup/:id", async (req, res) => {
            const { id } = req.params;
            const updatedProject = req.body;

            delete updatedProject._id;

            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: updatedProject,
            };

            try {
                const result = await projectsCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error updating project", error });
            }
        });



        app.get("/message", async (req, res) => {
            const message = await messageCollection.find().toArray();
            res.send(message);
        });


        app.post("/messagePost", async (req, res) => {
            const message = req.body;
            const result = await messageCollection.insertOne(message);
            res.send(result);
        });




        app.get("/logout", async (req, res) => {
            try {
                res
                    .clearCookie("token", {
                        maxAge: 0,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                    })
                    .send({ success: true });
            } catch (err) {
                res.status(500).send(err);
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } finally {
        process.on("SIGINT", async () => { });
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Tonmoy Portfolo Server is Running 🏃‍➡️🏃‍➡️🏃‍➡️");
});