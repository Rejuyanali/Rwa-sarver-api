import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 5000;

const API_BASE = "https://rozgarapinew.teachx.in";

const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjQ3NDc5NjkiLCJlbWFpbCI6ImFzaGVlc2guc2hpa2FyaXlhLm1haGFwdXJAZ21haWwuY29tIiwidGltZXN0YW1wIjoxNzY3MTM1NTczLCJ0ZW5hbnRUeXBlIjoidXNlciIsInRlbmFudE5hbWUiOiJyb3pnYXJfZGIiLCJ0ZW5hbnRJZCI6IiIsImRpc3Bvc2FibGUiOmZhbHNlfQ.RPp8T4TeHtPQo_bA3WaQ_xLi_h-HKpRSDZ-q_oP0n5A";
const USER_ID = "4747969";

app.get("/api", async (req, res) => {
  const { action, ...params } = req.query;

  let url;

  switch (action) {
    case "batches":
      url = `${API_BASE}/get/mycoursev2?userid=${USER_ID}`;
      break;

    case "subjects":
      if (!params.courseid) {
        return res.status(400).json({ error: "courseid parameter is required" });
      }
      url = `${API_BASE}/get/allsubjectfrmlivecourseclass?courseid=${params.courseid}&start=-1`;
      break;

    case "classes":
      if (!params.courseid || !params.subjectid) {
        return res.status(400).json({ error: "courseid and subjectid parameters are required" });
      }
      url = `${API_BASE}/get/alltopicfrmlivecourseclass?courseid=${params.courseid}&subjectid=${params.subjectid}&start=-1`;
      break;

    case "content":
      if (!params.courseid || !params.subjectid || !params.topicid) {
        return res.status(400).json({ error: "courseid, subjectid and topicid parameters are required" });
      }
      url = `${API_BASE}/get/livecourseclassbycoursesubtopconceptapiv3?courseid=${params.courseid}&subjectid=${params.subjectid}&topicid=${params.topicid}&start=0`;
      break;

    case "videoDetails":
      if (!params.course_id || !params.video_id) {
        return res.status(400).json({ error: "course_id and video_id parameters are required" });
      }
      url = `${API_BASE}/get/fetchVideoDetailsById?course_id=${params.course_id}&video_id=${params.video_id}&ytflag=0&folder_wise_course=0`;
      break;

    default:
      return res.status(400).json({ error: "Invalid action" });
  }

  // Log the URL for debugging (like error_log in PHP)
  console.log("API URL:", url);

  try {
    // EXACT headers as PHP version - no Bearer prefix
    const headers = {
      "Client-Service": "Appx",
      "source": "website",
      "Auth-Key": "appxapi",
      "Authorization": TOKEN,  // Direct token without "Bearer"
      "User-ID": USER_ID
    };

    console.log("Request Headers:", JSON.stringify(headers, null, 2));

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
      // Add these options to match PHP cURL behavior
      followRedirects: true,
    });

    // Log response status
    console.log("HTTP Code:", response.status);

    const text = await response.text();
    
    // Log response length (like PHP's strlen)
    console.log("Response length:", text.length);

    if (!response.ok) {
      console.log("External API Error:", text);
      return res.status(response.status).json({
        error: "API failed",
        details: text,
      });
    }

    // Try to parse as JSON, if fails return as text
    try {
      const jsonData = JSON.parse(text);
      res.json(jsonData);
    } catch (e) {
      // If not JSON, return as text
      res.send(text);
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

kya mai is api ki some phone me run kar sakta hun 
