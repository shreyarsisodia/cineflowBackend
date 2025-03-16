import express, { response } from "express";
//handles multipart form data
import multer from "multer";
import multerS3 from "multer-s3";
//for video handling
import ffmpeg from "fluent-ffmpeg";
//inbuilt for file paths
import path from "path";
import Video from "../models/video.js";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { S3Client } from "@aws-sdk/client-s3";

ffmpeg.setFfmpegPath(ffmpegPath.path);

const videoRouter = express.Router();

//configuring s3 bucket
const s3 = new S3Client({
  region: "eu-north-1", //process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "cineflow-videofiles", //process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `videos/${Date.now()}-${path.basename(file.originalname)}`);
    }
  })
});

// ✅ API Route: Upload Video to AWS S3
videoRouter.post("/upload", upload.single("url"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const videoFile = new Video({
      title: req.file.originalname,
      type: req.body.type,
      genre: req.body.genre,
      url: req.file.location
    });
    console.log("videoFile", videoFile);
    //save videofile to database
    await videoFile.save();
    res.json({
      message: "File uploaded successfully to S3",
      fileUrl: req.file.location // Returns S3 file URL
    });
  } catch (error) {
    res.status(500).json({
      message: "Error Uploading Video",
      error
    });
  }
});
// videoRouter.post("/upload", upload.single("url"), async (req, res) => {
//   try {
//     console.log("req", req);
//     const inputPath = req.file.path;
//     const outputPath = `${process.env.VIDEO_STORAGE_PATH}/${req.file.originalname}`;
//     ffmpeg(inputPath)
//       .output(outputPath)
//       .on("end", async () => {
//         const newVideo = new Video({
//           title: req.body.title,
//           url: outputPath
//         });
//         await newVideo.save();
//         res.status(201).json({
//           message: "Video Uploaded Successfully",
//           video: newVideo
//         });
//       })
//       .on("error", (err) => {
//         res.status(500).json({
//           error: err.message
//         });
//       })
//       .run();
//   } catch (error) {
//     res.status(500).json({
//       message: "Error Uploading Video",
//       error
//     });
//   }
// });

videoRouter.get("/getAllVideos", async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json({
      message: "Videos Fetched Successfully",
      videos: videos
    });
  } catch (error) {
    res.status(500).json({
      message: "Error Uploading Video",
      error
    });
  }
});

export default videoRouter;
