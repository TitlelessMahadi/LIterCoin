import { Telegraf } from 'telegraf';
import mongoose from 'mongoose';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import session from 'express-session';
import bodyParser from 'body-parser';
// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an Express app
const app = express();
const port = 3000;
const telegramBotToken = '6481207043:AAHvLBa_UZSvjMMjRvpWnAJULHUhHV3_FZc';
const bot = new Telegraf(telegramBotToken);
const webAppUrl = 'https://litercoin.onrender.com';
const channelId = 'litercoin';
const botUsername = 'LiterCoin_bot';
const mongoURI = 'mongodb+srv://ucchashait:DSd5zOJ0DLoejaiv@cluster0.oaaac.mongodb.net/tgbot';

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'yourSecretKey', // Replace with your own secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(mongoURI);


const preloadPages = () => {
    const pages = ['index.html', 'Frens.html', 'tasks.html'];

    pages.forEach(page => {
        const filePath = path.join(__dirname, 'public', page);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            cache.set(page, content);
            fs.writeFileSync(path.join(__dirname, 'cache', page), content);
        } catch (err) {
            console.error(`Error reading file ${filePath}:`, err);
        }
    });
};

const loadCacheFromDisk = () => {
    const pages = ['index.html', 'Frens.html', 'tasks.html'];

    pages.forEach(page => {
        const cacheFilePath = path.join(__dirname, 'cache', page);
        if (fs.existsSync(cacheFilePath)) {
            try {
                const content = fs.readFileSync(cacheFilePath, 'utf8');
                cache.set(page, content);
            } catch (err) {
                console.error(`Error reading cache file ${cacheFilePath}:`, err);
            }
        }
    });
};

loadCacheFromDisk();

// Set webhook
bot.telegram.setWebhook('https://litercoin.onrender.com/webhook').catch(err => console.error('Failed to set webhook:', err));

// Handle webhook updates
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

const { Schema } = mongoose;

const userSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    name: String,
    username: String,
    balance: { type: Number, default: 0 },
    referralUserIds: [String],
    referralsCount: { type: Number, default: 0 },
    lastClaimTime: { type: Date, default: null },
    inviterId: String,
    profilePhotoUrl: String,
    verifiedStatus: { type: Boolean, default: false },
    subscribed: { type: Boolean, default: false },
    packages: [{
        id: { type: String, required: true }, // Ensure 'id' field is included
        name: { type: String, required: true }, // Ensure 'name' field is included
        price: { type: Number, required: true },
        duration: { type: Number, required: true },
        description: { type: String, required: true },
        rewardEveryDay: { type: Number, required: true },
        lastClaimed: { type: Date, default: null },
        expiryDate: { type: Date, required: true }
    }],
    levelOneReferrals: [String],
    levelTwoReferrals: [String],
    levelThreeReferrals: [String],
    claimedTasks: [Number],
    taskRefBalance: { type: Number, default: 0 },
     refBalance: { type: Number, default: 0 },// Add this line
    withdrawalHistories: [{
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        status: { type: String, enum: ['done', 'pending'], default: 'pending' }
    }]
});



const User = mongoose.model('User', userSchema);

const pendingUserSchema = new Schema({
    userId: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    status: { type: String, default: 'pending' },
    submittedAt: { type: Date, default: Date.now }
});

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

const withdrawalSchema = new Schema({
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now }
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    reward: { type: Number, required: true },
    amount: { type: Number, required: true },
    url: { type: String, required: true },
    taskId: { type: Number, required: true },
    category: { type: String, required: true }// Added taskId field
});
const Task = mongoose.model('Task', taskSchema);




const doneWithdrawalSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    transactionId: { type: String, required: true }
});

const DoneWithdrawal = mongoose.model('DoneWithdrawal', doneWithdrawalSchema);



const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true }, // Changed to String
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);




app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());





const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

// Route to display the login page
app.get('/adminlogin', (req, res) => {
    res.sendFile(__dirname + '/login.html'); // Adjust path as needed
});

// Handle login submission
app.post('/adminlogin', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.send('Invalid credentials');
    }
});

// Middleware to protect admin routes
function ensureAuthenticated(req, res, next) {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/adminlogin');
}

app.get('/admin', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'pending.html')); // Serve the static HTML file
});

app.get('/withdrawalreq', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'pendingWithdrawal.html')); // Serve the static HTML file
});

app.get('/taskslist', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'tasklist.html')); // Serve the static HTML file
});


app.get('/api/pending-approvals', ensureAuthenticated, async (req, res) => {
    try {
        // Fetch all transaction IDs from the database
        const transactions = await Transaction.find().select('transactionId');
        const processedTransactionIds = transactions.map(tx => tx.transactionId);

        // Fetch pending users who do not have a processed transaction
        const pendingApprovals = await PendingUser.find({
            transactionId: { $nin: processedTransactionIds } // Exclude users with existing transaction IDs
        });

        res.json({ success: true, pendingApprovals });
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.json({ success: false, error: 'Error fetching data.' });
    }
});


app.post('/api/approve/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, transactionId } = req.body;

        // Find the user to approve
        const userToApprove = await User.findOne({ userId: id });
        if (!userToApprove) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Save transaction ID in a different schema
        const transaction = new Transaction({
            transactionId,
            amount,
            userId: id  // Store the userId who is being approved
        });
        await transaction.save();

        // Update the balance of the user
        userToApprove.balance += parseFloat(amount);
        await userToApprove.save();

        res.json({ success: true, message: 'User approved and balance updated.' });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});





app.post('/api/decline/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find and remove the pending approval
        const pendingApproval = await PendingUser.findById(id);

        if (!pendingApproval) {
            return res.json({ success: false, error: 'Pending approval not found.' });
        }

        // Remove the pending approval
        await PendingUser.findByIdAndDelete(id);

        // Optionally, you could also add logic here if needed

        res.json({ success: true, message: 'Pending approval declined successfully.' });
    } catch (error) {
        console.error('Error declining pending approval:', error);
        res.json({ success: false, error: 'Error declining pending approval.' });
    }
});



app.post('/api/create-task', async (req, res) => {
    const { title, reward, url, category } = req.body;

    if (!title || !reward || !url || !category) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        // Generate a new task ID
        const lastTask = await Task.findOne().sort({ taskId: -1 }).limit(1);
        const newTaskId = lastTask ? lastTask.taskId + 1 : 1;

        const task = new Task({ title, reward, url, category, taskId: newTaskId });
        await task.save();
        res.json({ success: true, task });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


app.delete('/api/delete-task/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Task.deleteOne({ taskId: parseInt(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});



app.post('/activateaccount', async (req, res) => {
    const { userId } = req.body;

    try {
        // Find the user by userId
        const user = await User.findOne({ userId }).exec();

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Check if the user has enough balance to activate the account
        if (user.balance < 150) {
            return res.status(400).json({ success: false, message: 'Insufficient balance You need 150 in your balance' });
        }

        // Deduct 100 from user's balance
        user.balance -= 150;

        // Update user's verifiedStatus to true
        user.verifiedStatus = true;

        // Define bonuses
        const bonuses = {
            inviterBonus: 20,
            levelTwoBonus: 7,
            levelThreeBonus: 3
        };

 const updateRefBalance = async (userId, amount) => {
            const userToUpdate = await User.findOne({ userId }).exec();
            if (userToUpdate) {
                userToUpdate.refBalance += amount;  // Update refBalance
                await userToUpdate.save();
            }
        };

        // Bonus for the inviter
        if (user.inviterId) {
            await updateRefBalance(user.inviterId, bonuses.inviterBonus);

            // Bonus for the inviter's inviter (level two)
            const inviter = await User.findOne({ userId: user.inviterId }).exec();
            if (inviter && inviter.inviterId) {
                await updateRefBalance(inviter.inviterId, bonuses.levelTwoBonus);

                // Bonus for the inviter's inviter's inviter (level three)
                const levelTwoInviter = await User.findOne({ userId: inviter.inviterId }).exec();
                if (levelTwoInviter && levelTwoInviter.inviterId) {
                    await updateRefBalance(levelTwoInviter.inviterId, bonuses.levelThreeBonus);
                }
            }
        }

        // Save the updated user document
        await user.save();
        res.json({ success: true, message: 'Account activated, balance deducted, and bonuses distributed successfully' });

    } catch (error) {
        console.error('Error activating account:', error);
        res.status(500).send('Internal Server Error');
    }
});







app.post('/claim', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Not authenticated');
    }

    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        let claimed = false;

        user.packages.forEach(pkg => {
            if (pkg.lastClaimed && pkg.lastClaimed >= startOfDay) {
                claimed = true;
            }

            if (!claimed) {
                const timeToNextClaim = (pkg.lastClaimed && pkg.lastClaimed >= startOfDay) ? 0 : Math.max(0, endOfDay - now);

                if (timeToNextClaim === 0) {
                    // User can claim the reward
                    user.balance += pkg.rewardEveryDay;
                    pkg.lastClaimed = now;
                    claimed = true;
                }
            }
        });

        if (!claimed) {
            return res.status(400).send('You have already claimed today or you do not have any active packages.');
        }

        await user.save();
        res.send('Claim successful');
    } catch (error) {
        console.error('Error claiming reward:', error);
        res.status(500).send('Internal Server Error');
    }
});



const availablePackages = {
    'pack1': { id: 'pack1', name: 'Basic Pack', price: 150, description: 'Receive 1500 LTR every day.', rewardEveryDay: 15000 },
    'pack2': { id: 'pack2', name: 'Standard Pack', price: 300, description: 'Receive 30000 LTR every day.', rewardEveryDay: 30000 },
    'pack3': { id: 'pack3', name: 'Premium Pack', price: 500, description: 'Receive 50000 LTR every day.', rewardEveryDay: 500000 }
};


// Handle package purchase
// Handle package purchase
app.post('/purchase-package', async (req, res) => {
    const { userId, packageId } = req.body;

    try {
        const selectedPackage = availablePackages[packageId];

        if (!selectedPackage) {
            return res.status(400).send('Invalid package ID');
        }

        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.balance < selectedPackage.price) {
            return res.status(400).send('Insufficient balance');
        }

        user.balance -= selectedPackage.price;
        user.packages.push({
            id: selectedPackage.id,
            name: selectedPackage.name,
            price: selectedPackage.price,
            duration: selectedPackage.duration,
            description: selectedPackage.description,
            rewardEveryDay: selectedPackage.rewardEveryDay,
            lastClaimed: null // Initialize the lastClaimed to null
        });

        await user.save();
        res.redirect('/packages?success=true');
    } catch (error) {
        console.error('Error purchasing package:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/packages', async (req, res) => {
    try {
        const userId = req.session.userId;

        const user = await User.findOne({ userId }).exec();

        if (!user) {
            return res.status(404).send('User not found');
        }

        const now = new Date();

        const ownedPackages = user.packages.map(pkg => {
            const lastClaimed = pkg.lastClaimed ? new Date(pkg.lastClaimed) : null;
            let canClaim = false;
            let remainingTimeInSeconds = 0;

            if (lastClaimed) {
                const timeSinceLastClaim = (now - lastClaimed) / (1000 * 60 * 60); // in hours
                canClaim = timeSinceLastClaim >= 24;
                remainingTimeInSeconds = Math.max(24 * 3600 - (timeSinceLastClaim * 3600), 0); // Remaining seconds to next claim
            } else {
                canClaim = true;
            }

            const remainingHours = Math.floor(remainingTimeInSeconds / 3600);
            const remainingMinutes = Math.floor((remainingTimeInSeconds % 3600) / 60);
            const remainingSeconds = Math.floor(remainingTimeInSeconds % 60); // Round seconds

            return {
                ...pkg._doc,
                canClaim,
                remainingTimeInSeconds,
                remainingHours,
                remainingMinutes,
                remainingSeconds
            };
        });

        const ownedPackageIds = new Set(user.packages.map(pkg => pkg.id));
        const filteredAvailablePackages = Object.values(availablePackages).filter(pkg => !ownedPackageIds.has(pkg.id));

        res.render('packages', {
            availablePackages: filteredAvailablePackages,
            ownedPackages,
            userId
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.post('/claim-reward', async (req, res) => {
    const { userId, packageId } = req.body;

    try {
        const user = await User.findOne({ userId }).exec();

        if (!user) {
            return res.status(404).send('User not found');
        }

        const packageIndex = user.packages.findIndex(pkg => pkg.id === packageId);

        if (packageIndex === -1) {
            return res.status(404).send('Package not found');
        }

        const now = new Date();
        const pkg = user.packages[packageIndex];
        const lastClaimed = pkg.lastClaimed ? new Date(pkg.lastClaimed) : null;
        let canClaim = false;

        if (lastClaimed) {
            const timeSinceLastClaim = (now - lastClaimed) / (1000 * 60 * 60); // in hours
            canClaim = timeSinceLastClaim >= 24; // Can claim every 24 hours
        } else {
            canClaim = true; // If never claimed, can claim immediately
        }

        if (!canClaim) {
            const remainingTime = Math.ceil(24 - ((now - lastClaimed) / (1000 * 60 * 60))); // Remaining hours to next claim
            return res.status(400).send(`You can claim your reward in ${remainingTime} hours`);
        }

        user.taskRefBalance += pkg.rewardEveryDay;
        user.packages[packageIndex].lastClaimed = now;

        await user.save();
        res.redirect('/packages');
    } catch (error) {
        console.error('Error claiming reward:', error);
        res.status(500).send('Internal Server Error');
    }
});





app.get('/withdraw', async (req, res) => {
    try {
        // Log the session userId for debugging
        console.log('Session UserID:', req.session.userId);

        // Check if userId exists in session
        if (!req.session.userId) {
            return res.redirect('/error'); // Redirect to error page or login if no session userId
        }

        // Path to the withdrawal HTML file
        const withdrawFilePath = path.join(__dirname, 'withdraw.html');
        res.sendFile(withdrawFilePath);
    } catch (error) {
        console.error('Error serving withdrawal page:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

app.post('/withdraw', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'No userId in session' });
        }

        const { paymentMethod, amount, phoneNumber } = req.body;

        if (amount < 200) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is 200.' });
        }

        if (!paymentMethod || typeof paymentMethod !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid payment method.' });
        }

        if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.length < 10) {
            return res.status(400).json({ success: false, message: 'Invalid phone number.' });
        }

        // Find the user by userId
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check if user has at least 5 level one referrals
        if (user.levelOneReferrals.length < 5) {
            return res.status(400).json({ success: false, message: 'You need at least 5 level one referrals to withdraw money.' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance.' });
        }

        // Deduct the amount and save the user
        user.balance -= amount;
        await user.save();

        // Create a new withdrawal request
        const newWithdrawal = new Withdrawal({
            userId,
            amount,
            paymentMethod,
            phoneNumber
        });

        await newWithdrawal.save();

        res.status(200).json({ success: true, message: 'Withdrawal request submitted successfully' });
    } catch (error) {
        console.error('Error processing withdrawal request:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});



app.get('/api/pending-withdrawals', async (req, res) => {
    try {
        const pendingWithdrawals = await Withdrawal.find({ status: 'pending' });

        res.json({
            success: true,
            pendingWithdrawals
        });
    } catch (error) {
        console.error('Error fetching pending withdrawals:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching pending withdrawals.'
        });
    }
});


app.post('/api/approve-withdrawal/:id', async (req, res) => {
    const { id } = req.params;
    const { transactionId } = req.body;

    if (!transactionId) {
        return res.status(400).json({ success: false, error: 'Transaction ID is required.' });
    }

    try {
        // Find the pending withdrawal
        const withdrawal = await Withdrawal.findById(id);

        if (!withdrawal) {
            return res.status(404).json({ success: false, error: 'Withdrawal not found.' });
        }

        // Update the withdrawal status
        await Withdrawal.findByIdAndUpdate(id, { status: 'approved' });

        // Save the approved withdrawal details
        await DoneWithdrawal.create({
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            transactionId: transactionId,
            date: new Date()
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        res.status(500).json({ success: false, error: 'An error occurred while approving the withdrawal.' });
    }
});











// Express.js route to get user ID from session
app.get('/api/get-session-user-id', (req, res) => {
    const userId = req.session.userId;
    if (userId) {
        res.json({ userId });
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
});






app.get('/user-details', async (req, res) => {
    try {
        const userId = req.session.userId; // Get userId from session
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});




// Route to claim rewards
app.post('/claim', async (req, res) => {
    try {
        // Retrieve userId from the session
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Find the user by userId from the session
        const user = await User.findOne({ userId });
        const now = new Date();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        if (user.lastClaimTime && (now - new Date(user.lastClaimTime)) < fourHours) {
            return res.json({ success: false, message: 'You must wait before claiming again.' });
        }

        user.balance += 10; // Example reward
        user.lastClaimTime = now;
        await user.save();
        res.json({ success: true, balance: user.balance });
    } catch (error) {
        console.error('Error claiming balance:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Route to update subscription status
app.post('/update-subscription', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.redirect('/error');
        }

        // Find the user who is updating their subscription status
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the user is already subscribed
        if (user.subscribed) {
            return res.status(400).json({ success: false, message: 'Already subscribed' });
        }

        // Update the subscription status
        user.subscribed = true;
        await user.save();

        // Increment the referrer's referralsCount if there's an inviter
        if (user.inviterId) {
            const referrer = await User.findOne({ userId: user.inviterId });
            if (referrer) {
                referrer.referralsCount = (referrer.referralsCount || 0) + 1;
                await referrer.save();
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating subscription status:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});



app.get('/user-frens', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            throw new Error('No userId provided');
        }

        // Find the user
        const user = await User.findOne({ userId });
        if (!user) {
            throw new Error('User not found');
        }

        // Find the user's friends and include level information
        const levels = {
            levelOne: await User.find({ userId: { $in: user.levelOneReferrals }, verifiedStatus: true }),
            levelTwo: await User.find({ userId: { $in: user.levelTwoReferrals }, verifiedStatus: true }),
            levelThree: await User.find({ userId: { $in: user.levelThreeReferrals }, verifiedStatus: true })
        };

        // Ensure the data is being populated correctly
        console.log('Level One Referrals:', levels.levelOne);
        console.log('Level Two Referrals:', levels.levelTwo);
        console.log('Level Three Referrals:', levels.levelThree);

        const allFrens = [
            ...levels.levelOne.map(user => ({ ...user._doc, level: '1' })),
            ...levels.levelTwo.map(user => ({ ...user._doc, level: '2' })),
            ...levels.levelThree.map(user => ({ ...user._doc, level: '3' }))
        ];

        res.json({ success: true, frens: allFrens });
    } catch (error) {
        console.error('Error fetching friends list:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});



app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        const formattedTasks = tasks.map(task => ({
            title: task.title,
            reward: task.reward,
            amount: task.amount,
            url: task.url,
            taskId: task.taskId,
            category: task.category
        }));
        res.json({ success: true, tasks: formattedTasks });
    } catch (error) {
        console.error('Error fetching tasks:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/tasks', (req, res) => {
    const tasksFilePath = path.join(__dirname, 'tasks.html');
    res.sendFile(tasksFilePath);
});


app.get('/getUserStatus', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const user = await User.findOne({ userId: req.session.userId }).exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ verifiedStatus: user.verifiedStatus });
    } catch (error) {
        console.error('Error fetching user status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





app.get('/deposit', (req, res) => {
    // Optionally, set session userId if needed
    if (!req.session.userId) {
        return res.redirect('/error'); // or wherever you handle non-authenticated users
    }

    const tasksFilePath = path.join(__dirname, 'activate.html');
    res.sendFile(tasksFilePath);
});




app.get('/error', (req, res) => {
    const errorFilePath = path.join(__dirname, 'error.html');
    res.sendFile(errorFilePath);
});

// Route to fetch tasks data as JSON
// Route to fetch tasks data as JSON
// Route to fetch tasks data as JSON















app.post('/claim-task', async (req, res) => {
    const { userId, taskId } = req.body;

    if (!userId || !taskId) {
        return res.status(400).json({ success: false, message: 'Missing userId or taskId' });
    }

    try {
        // Log values for debugging
        console.log('Looking for taskId:', taskId);
        console.log('Looking for userId:', userId);

        // Convert taskId to a number or string as needed
        const task = await Task.findOne({ taskId: Number(taskId) });
        if (!task) {
            console.log('Task not found for taskId:', taskId);
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Find user by userId
        const user = await User.findOne({ userId: userId.toString() });
        if (!user) {
            console.log('User not found for userId:', userId);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the task has already been claimed
        if (user.claimedTasks.includes(taskId)) {
            return res.status(400).json({ success: false, message: 'Task already claimed' });
        }

        // Add reward to user's balance
        user.taskRefBalance += task.reward;

        // Track claimed tasks
        user.claimedTasks.push(taskId);
        await user.save();

        res.json({ success: true, balance: user.balance });
    } catch (error) {
        console.error('Error claiming task:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.get('/api/user/:userId/claimed-tasks', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        if (user) {
            res.json({ success: true, claimedTasks: user.claimedTasks || [] });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching claimed tasks:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});



// Server-side (Node.js)
app.post('/referralbonus', async (req, res) => {
  try {
    // Retrieve userId from session
    const userId = req.session.userId; 
    const { taskId } = req.body;

    if (!userId || !taskId) {
      return res.status(400).json({ success: false, message: 'Missing userId or taskId' });
    }

    // Fetch user details
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch task details
    const task = permanentTasks.find(task => task.taskId === taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if the user has enough referrals to claim the task
    if (user.referralsCount >= task.neededReferral) {
      // Check if the user has already claimed this task
      if (user.claimedTasks.includes(taskId)) {
        return res.json({
          success: true,
          message: 'Task already claimed',
          alreadyClaimed: true,
        });
      }

      // Add the reward to the user's balance
      user.balance += task.reward;
      user.taskRefBalance += task.reward;
      user.claimedTasks.push(taskId);
      await user.save();

      return res.json({
        success: true,
        message: 'Task claimed successfully',
        balance: user.balance,
        alreadyClaimed: false,
      });
    } else {
      // Calculate needed referrals
      const neededReferrals = task.neededReferral - user.referralsCount;
      return res.json({ success: false, message: `You need ${neededReferrals} more referrals`, neededReferrals });
    }
  } catch (error) {
    console.error('Error processing referral bonus:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



app.post('/activate', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'No userId in session' });
        }

        const { paymentMethod, transactionId, phoneNumber } = req.body;

        const newPendingUser = new PendingUser({
            userId,
            paymentMethod,
            transactionId,
            phoneNumber
        });

        await newPendingUser.save();

        res.status(200).json({ success: true, message: 'Activation request submitted successfully' });
    } catch (error) {
        console.error('Error submitting activation request:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});







app.get('/', async (req, res) => {
  const userId = req.query.userId; // Get userId from query parameter

  if (userId) {
    try {
      let user = await User.findOne({ userId });
      if (!user) {
        user = new User({ userId });
        await user.save();
      }

      // Fetch user's profile photo using Telegraf
      const userProfile = await bot.telegram.getUserProfilePhotos(userId);
      const profilePhotos = userProfile.photos;

      if (profilePhotos.length > 0) {
        const profilePhoto = profilePhotos[0][0]; // Get the highest resolution photo
        const fileId = profilePhoto.file_id;

        // Fetch the file path using the file ID
        const file = await bot.telegram.getFile(fileId);
        const filePath = file.file_path;

        if (filePath) {
          const profilePhotoUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`;
          user.profilePhotoUrl = profilePhotoUrl; // Update user document
          await user.save();
        } else {
          console.error('File path is undefined');
        }
      } else {
        console.error('No profile photos found');
      }

      req.session.userId = user.userId; // Store userId in session
    } catch (err) {
      console.error('Error handling user:', err);
      return res.status(500).send('Error handling user');
    }
  } else {
    // Handle the case where userId is not provided
    return res.redirect('/error');
  }

  res.redirect('/home');
});



// Route for the root path to serve the HTML
app.get('/home', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('User not authenticated');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});









app.get('/Frens', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'Frens.html'));
    } else {
        res.redirect('/error'); // Redirect to home or login if session userId is not present
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



bot.command('start', async (ctx) => {
    const chatId = ctx.chat.id;
    const name = ctx.chat.first_name;
    const username = ctx.chat.username;

    // Extract referral ID from the command text
    const referralId = ctx.message.text.split(' ')[1];

    try {
        // Check if the user already exists
        let user = await User.findOne({ userId: chatId.toString() });

        if (user) {
            if (user.verified) {
                // Handle existing verified users
                await sendWelcomeMessage(ctx, name, chatId);
            } else {
                // Check if the user is in the channel
                const memberStatus = await checkChannelMembership(chatId);

                if (memberStatus.status === 'member' || memberStatus.status === 'administrator' || memberStatus.status === 'creator') {
                    // Mark user as verified
                    user.verified = true;
                    await user.save();
                    await sendWelcomeMessage(ctx, name, chatId);
                } else {
                    // Prompt verification
                    await promptVerification(ctx, chatId);
                }
            }
        } else {
            // Handle new user and referral validation
            if (referralId) {
                await handleNewUser(ctx, referralId, chatId, name, username);
            } else {
                await ctx.reply("No referral ID provided. Please start with a valid referral ID.");
            }
        }
    } catch (error) {
        console.error('Error handling /start command:', error);
        await ctx.reply("An error occurred while processing your request.");
    }
});
async function handleNewUser(ctx, referralId, chatId, name, username) {
    try {
        // Check if the referral ID is valid
        const inviter = await User.findOne({ userId: referralId });
        if (inviter) {
            // Create a new user if not found
            const user = new User({
                userId: chatId.toString(),
                name,
                username,
                inviterId: referralId
            });

            // Save the new user
            await user.save();

            // Update referral levels
            let updated = false;

            // Check and update Level 1
            if (!inviter.levelOneReferrals.includes(chatId.toString())) {
                inviter.levelOneReferrals.push(chatId.toString());
                await inviter.save();
                updated = true;
            }

            // Check and update Level 2
            if (inviter.inviterId) {
                const levelTwoReferrer = await User.findOne({ userId: inviter.inviterId });
                if (levelTwoReferrer && !levelTwoReferrer.levelTwoReferrals.includes(chatId.toString())) {
                    levelTwoReferrer.levelTwoReferrals.push(chatId.toString());
                    await levelTwoReferrer.save();
                    updated = true;
                }

                // Check and update Level 3
                if (levelTwoReferrer && levelTwoReferrer.inviterId) {
                    const levelThreeReferrer = await User.findOne({ userId: levelTwoReferrer.inviterId });
                    if (levelThreeReferrer && !levelThreeReferrer.levelThreeReferrals.includes(chatId.toString())) {
                        levelThreeReferrer.levelThreeReferrals.push(chatId.toString());
                        await levelThreeReferrer.save();
                        updated = true;
                    }
                }
            }

            if (!updated) {
                // If no updates were made, notify the user
                await ctx.reply("Referral update failed.");
                return;
            }

            // Check channel membership and prompt verification if necessary
            const membership = await checkChannelMembership(chatId);
            if (membership.status === 'member' || membership.status === 'administrator' || membership.status === 'creator') {
                user.verified = true;
                await user.save();
                await sendWelcomeMessage(ctx, name, chatId);
            } else {
                await promptVerification(ctx, chatId);
            }
        } else {
            await ctx.reply("Invalid referral ID. Please make sure you have a valid referral ID and try again.");
        }
    } catch (error) {
        console.error('Error handling new user:', error);
        await ctx.reply("An error occurred while processing your referral.");
    }
}




async function sendWelcomeMessage(ctx, name, chatId) {
    try {
        await ctx.replyWithAnimation('https://i.ibb.co/6WjrsZP/bitcoin-cryptocurrency.gif', {
            caption: `Hey, ${name}! \n\nNow grab your mining opportunity today at very strong capabilities. Now let's start to join our bot. 👇👇`,
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Join Channel', url: `https://t.me/${channelId.replace('@', '')}` }],
                    [{ text: 'Get Your Invite URL', callback_data: 'get_invite_url' }],
                    [{ text: 'Start Mining ⚡', web_app: { url: `${webAppUrl}/?userId=${chatId}` } }]
                ],
            },
        });

        await ctx.setChatMenuButton({
            type: 'web_app',
            text: '🕹️ Open app',
            web_app: { url: `${webAppUrl}/?userId=${chatId}` }
        });
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}

async function promptVerification(ctx, chatId) {
    try {
        await ctx.reply("Please join the required channel and press the 'Verify' button below once done.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Join Channel', url: `https://t.me/${channelId.replace('@', '')}` }],
                    [{ text: 'Verify', callback_data: `verify_${chatId}` }]
                ],
            },
        });
    } catch (error) {
        console.error('Error prompting verification:', error);
    }
}

async function checkChannelMembership(chatId) {
    try {
        // Ensure that channelId is correctly formatted
        const channelIdFormatted = channelId.startsWith('@') ? channelId : `@${channelId}`;

        // Use Telegraf's getChatMember method to check membership
        const chatMember = await bot.telegram.getChatMember(channelIdFormatted, chatId);

        // Log the response for debugging
        console.log('API Response:', chatMember);

        // Check the user's status in the channel
        if (chatMember.status === 'member') {
            return { status: 'member', isAdmin: false, isOwner: false };
        } else if (chatMember.status === 'administrator') {
            return { status: 'administrator', isAdmin: true, isOwner: false };
        } else if (chatMember.status === 'creator') {
            return { status: 'creator', isAdmin: true, isOwner: true };
        } else {
            return { status: chatMember.status, isAdmin: false, isOwner: false };
        }
    } catch (error) {
        console.error('Error checking channel membership:', error);
        return { status: 'left', isAdmin: false, isOwner: false };
    }
}


bot.action(/verify_(\d+)/, async (ctx) => {
    const chatId = ctx.match[1];
    const name = ctx.chat.first_name;

    try {
        const user = await User.findOne({ userId: chatId });

        if (!user) {
            return await ctx.answerCbQuery('User not found.');
        }

        // Check if the user is in the channel and if they have admin rights
        const membership = await checkChannelMembership(chatId);

        console.log('Membership Check Result:', membership);

        if (membership.status !== 'member' && membership.status !== 'administrator' && membership.status !== 'creator') {
            return await ctx.answerCbQuery('Please join the channel to verify.');
        }

        // Mark user as verified
        user.verified = true;
        await user.save();

        await ctx.answerCbQuery('Verification successful!');
        await ctx.replyWithAnimation('https://i.ibb.co/6WjrsZP/bitcoin-cryptocurrency.gif', {
            caption: `Hey, ${name}! \n\nNow grab your mining opportunity today at very strong capabilities. Now let's start to join our bot. 👇👇`,
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Join Channel', url: `https://t.me/${channelId.replace('@', '')}` }],
                    [{ text: 'Get Your Invite URL', callback_data: 'get_invite_url' }],
                    [{ text: 'Start Mining ⚡', web_app: { url: `${webAppUrl}/?userId=${chatId}` } }]
                ],
            },
        });

        await ctx.setChatMenuButton({
            type: 'web_app',
            text: '🕹️ Open app',
            web_app: { url: `${webAppUrl}/?userId=${chatId}` }
        });

    } catch (error) {
        console.error('Error during verification:', error);
        await ctx.answerCbQuery('An error occurred.');
    }
});





// Update the callback query handler
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const chatId = ctx.chat.id;

    if (data === 'get_invite_url') {
        await ctx.reply(`Here is your invite URL: https://t.me/${botUsername}?start=${chatId}`);
    } else if (data === 'done') {
        try {
            const member = await ctx.telegram.getChatMember(channelId, chatId);
            if (['member', 'administrator', 'creator'].includes(member.status)) {
                let user = await User.findOne({ userId: chatId.toString() });
                if (!user) {
                    await ctx.reply('You need to start the bot first.');
                    return;
                }

             
                user.subscribed = true;
                await user.save();

                await ctx.reply(`Thank you for subscribing! ${user.name}`);
                await ctx.reply('Please use the options below:', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Tap to Earn', web_app: { url: `${webAppUrl}/norcoin?userId=${chatId}` } }],
                            [{ text: 'Menu', web_app: { url: `${webAppUrl}?userId=${chatId}` } }]
                        ]
                    }
                });
            } else {
                await ctx.reply('You need to be a member of the channel to proceed.');
            }
        } catch (error) {
            console.error('Error checking channel membership:', error);
            await ctx.reply('Error verifying your subscription.');
        }
    }
});



bot.launch();
