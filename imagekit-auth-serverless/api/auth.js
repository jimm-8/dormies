import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: "public_4etKUvIw7NzEO6bFb0WfzecVFKo=",
  privateKey: "private_AWX7GK8brgddLyirH7i0dR+kHiw=",
  urlEndpoint: "https://ik.imagekit.io/jamnwgicn",
});

export default function handler(req, res) {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    res.status(200).json(authenticationParameters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
