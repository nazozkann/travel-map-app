import { useState } from "react";

export default function PinForm() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    image: null,
  });

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const data = new FormData();
    data.append("title", formData.title);
    data.append("category", formData.category);
    data.append("description", formData.description);
    data.append("createdBy", "testuser");

    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      const res = await fetch("http://localhost:8000/api/pins", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      console.log("✅ Pin eklendi:", result);
    } catch (err) {
      console.error("❌ Hata oluştu:", err);
    }
  }

  return (
    <form
      id="pin-form"
      className="pin-form"
      onSubmit={handleSubmit}
      encType="multipart/form-data"
    >
      <input
        type="text"
        name="title"
        placeholder="title"
        required
        onChange={handleChange}
      />
      <select
        name="category"
        id="pin-category"
        required
        onChange={handleChange}
      >
        <option value="">Select category</option>
        <option value="food-drink">Food & Drink</option>
        <option value="cultural">Cultural</option>
        <option value="accommodation">Accommodation</option>
        <option value="entertainment">Entertainment</option>
        <option value="nature">Nature</option>
        <option value="other">Other</option>
      </select>
      <textarea
        name="description"
        placeholder="description"
        required
        onChange={handleChange}
      ></textarea>
      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
