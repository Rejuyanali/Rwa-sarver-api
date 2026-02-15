// server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Base URL for the external API
const BASE_URL = 'https://spidyuniverserwa.vercel.app/api/proxy';

// Helper function to read batches.json file
const getBatchesData = () => {
    try {
        const batchesPath = path.join(__dirname, 'batches.json');
        const fileContent = fs.readFileSync(batchesPath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading batches.json:', error.message);
        return null;
    }
};

// Main API endpoint
app.get('/api', async (req, res) => {
    try {
        const { action, courseid, subjectid, topicid, videoid, course_id, video_id } = req.query;

        if (!action) {
            return res.status(400).json({ error: 'Action parameter is required' });
        }

        // Handle batches action - local file
        if (action === 'batches') {
            const batchesData = getBatchesData();
            if (batchesData) {
                return res.json(batchesData);
            } else {
                return res.status(500).json({ 
                    status: 500,
                    msg: "Internal Server Error",
                    error: "Could not read batches.json file" 
                });
            }
        }

        let apiUrl = `${BASE_URL}`;
        let finalAction = action;

        // Handle different action naming conventions
        if (action === 'videoDetails') {
            finalAction = 'video_details';
        }

        // Use course_id if courseid is not provided
        const finalCourseId = courseid || course_id;
        
        // Use video_id if videoid is not provided
        const finalVideoId = videoid || video_id;

        // Construct URL based on action
        switch(finalAction) {
            case 'subjects':
                if (!finalCourseId) {
                    return res.status(400).json({ error: 'Course ID is required for subjects' });
                }
                apiUrl += `?mode=subjects&courseId=${finalCourseId}`;
                break;
                
            case 'topics':
                if (!finalCourseId || !subjectid) {
                    return res.status(400).json({ error: 'Course ID and Subject ID are required for topics' });
                }
                apiUrl += `?mode=topics&courseId=${finalCourseId}&subjectId=${subjectid}`;
                break;
                
            case 'classes':
                if (!finalCourseId || !subjectid) {
                    return res.status(400).json({ error: 'Course ID and Subject ID are required for classes' });
                }
                apiUrl += `?mode=topics&courseId=${finalCourseId}&subjectId=${subjectid}`;
                break;
                
            case 'content':
                if (!finalCourseId || !subjectid || !topicid) {
                    return res.status(400).json({ error: 'Course ID, Subject ID, and Topic ID are required for content' });
                }
                apiUrl += `?mode=content&courseId=${finalCourseId}&subjectId=${subjectid}&topicId=${topicid}`;
                break;
                
            case 'video_details':
                if (!finalCourseId || !finalVideoId) {
                    return res.status(400).json({ error: 'Course ID and Video ID are required for video details' });
                }
                apiUrl += `?mode=video_details&courseId=${finalCourseId}&videoId=${finalVideoId}`;
                break;
                
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        // Make request to external API
        console.log(`Fetching from: ${apiUrl}`);
        const apiResponse = await axios.get(apiUrl);
        
        // Send the response exactly as received from the external API
        res.json(apiResponse.data);

    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            res.status(504).json({ 
                status: 504,
                msg: "Gateway Timeout",
                error: "No response from external API" 
            });
        } else {
            // Something happened in setting up the request that triggered an Error
            res.status(500).json({ 
                status: 500,
                msg: "Internal Server Error",
                error: error.message 
            });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 200, 
        msg: "Server is running",
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET /api?action=batches - Get batches from local batches.json`);
    console.log(`  GET /api?action=subjects&courseid=COURSE_ID`);
    console.log(`  GET /api?action=topics&courseid=COURSE_ID&subjectid=SUBJECT_ID`);
    console.log(`  GET /api?action=classes&courseid=COURSE_ID&subjectid=SUBJECT_ID`);
    console.log(`  GET /api?action=content&courseid=COURSE_ID&subjectid=SUBJECT_ID&topicid=TOPIC_ID`);
    console.log(`  GET /api?action=video_details&courseid=COURSE_ID&videoid=VIDEO_ID`);
    console.log(`  GET /api?action=videoDetails&course_id=COURSE_ID&video_id=VIDEO_ID (also supported)`);
    console.log(`  GET /health`);
});
