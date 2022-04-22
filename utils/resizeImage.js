import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import expressAsyncHandler from "express-async-handler";
const __dirname = path.resolve();

const getRandomFilenameByUUID = () => `${uuidv4()}.png`;
// const index = () => 
const save = async (folderpath, buffer) => {
  const filename = getRandomFilenameByUUID();
  const filepath = path.join(folderpath, filename);
  
  await sharp(buffer)
    .resize(640, 640, {
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFile(filepath);
  return filename;
};
const resize = {
  getRandomFilenameByUUID,
  save,
};
export default resize;
