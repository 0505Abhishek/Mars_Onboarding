const path = require('path');
const fs = require('fs');
const imageUpload = async(files)=>{

        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePaths = {};

        for(let key in files) {
            
            if (Object.hasOwnProperty.call(files, key)) {
                const uploadedFile = files[key];
                if (!uploadedFile || !uploadedFile.name) {
                    continue; 
                }
                const fileExtension = path.extname(uploadedFile.name);
                const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}${fileExtension}`;
                const uploadPath = path.join(uploadDir, fileName);
                // console.log();
                await fileRead(uploadedFile,uploadPath);
                

                filePaths[key] = `${fileName}`;
            }
        }

    return filePaths;
};

const fileRead=async(req,directory_path)=>{
   
    return new Promise((resolve, reject) => {
        fs.readFile(req.path, async (error, result) => {
          if (error) {
            return reject({ message: 'Sorry, file couldn\'t be uploaded.',
            filename: directory_path,
            code:500,
            status:false});
          }
          return resolve(await fileWrite(req,result,directory_path));
        });
      });
  }
  const fileWrite=async(req,data,directory_path)=>{
    
    return new Promise((resolve, reject) => {
        fs.writeFile(directory_path,data, (error, result) => {
          if (error) {
            return reject({ message: 'Sorry, file couldn\'t be uploaded.',
            filename: directory_path,
            code:500,
            status:false});
          }
          return resolve({
            message: 'File uploaded successfully',
            filename: directory_path,
            code:200,
            status:true
          });
        });
     
      });
  }
module.exports={imageUpload};