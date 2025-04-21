export default function PinForm() {
  return (
    <form id="pin-form" className="pin-form">
      <input type="text" name="title" placeholder="title" required />
      <select name="category" id="pin-category" required>
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
      ></textarea>
      <button type="submit">Submit</button>
    </form>
  );
}
