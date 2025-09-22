import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import { createOrder } from "../../services/apiRestaurant";
import Button from "../../ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, getCart, getTotalCartPrice } from "../cart/cartSlice";
import EmptyCart from "../cart/EmptyCart";
import store from "../../store";
import { formatCurrency } from "../../utils/helpers";
import { useState } from "react";
import { fetchAdress } from "../user/userSlice";

// https://uibakery.io/regex-library/phone-number
const isValidPhone = (str) =>
  /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(
    str,
  );

// const isValidNumber = (str) => str.length === 10;

function CreateOrder() {
  const [withPriority, setWithPriority] = useState(false);
  const user = useSelector((state) => state.user);
  const {
    username,
    address,
    status: addressStatus,
    position,
    error: errorAddress,
  } = user;
  const isLoadingAddress = addressStatus === "loading";
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const formErrors = useActionData();
  const dispatch = useDispatch();
  const cart = useSelector(getCart);
  const totalCartPrice = useSelector(getTotalCartPrice);
  const priorityPrice = withPriority ? totalCartPrice * 0.2 : 0;
  const totalPrice = totalCartPrice + priorityPrice;
  if (!cart.length) return <EmptyCart />;
  return (
    <div className="px-4 py-6">
      <h2 className="my-5 text-xl font-semibold">Ready to order? Let's go!</h2>

      {/* <Form method="POST" action="/order/new"> */}
      <Form method="POST" action="/order/new">
        <div className="gap-2: mb-5 flex flex-col">
          <label>First Name</label>
          <input
            type="text"
            className="input"
            defaultValue={username}
            name="customer"
            required
          />
        </div>

        <div>
          <label>Phone number</label>
          <div className="grow">
            <input type="tel" className="input" name="phone" required />
            {formErrors?.phone && (
              <p className="mt-2 rounded-md p-2 text-xs text-red-700 file:bg-red-100">
                {formErrors.phone}
              </p>
            )}
            {/* {formErrors?.num && <p>{formErrors.num}</p>} */}
          </div>
        </div>

        <div>
          <label>Address</label>
          <div className="relative flex flex-col gap-2 md:flex-row">
            <div className="grow">
              <input
                className="input w-full"
                type="text"
                name="address"
                disabled={isLoadingAddress}
                defaultValue={address}
                required
              />
              {addressStatus === "error" && (
                <p className="mt-2 rounded-md p-2 text-xs text-red-700 file:bg-red-100">
                  {errorAddress}
                </p>
              )}
            </div>
            {!position.latitude && !position.longitude && (
              <span className="absolute right-[3px] z-50 mt-[3px]">
                <Button
                  type="small"
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(fetchAdress());
                  }}
                >
                  Get-Position
                </Button>
              </span>
            )}
          </div>
        </div>

        <div className="space-x-2">
          <input
            className="my-3 h-3.5 w-3.5 accent-yellow-400 focus:outline-none focus:ring focus:ring-yellow-300 focus:ring-offset-2 md:h-6 md:w-6"
            type="checkbox"
            name="priority"
            id="priority"
            value={withPriority}
            onChange={(e) => setWithPriority(e.target.checked)}
          />
          <label htmlFor="priority">Want to yo give your order priority?</label>
        </div>

        <div>
          <input type="hidden" name="cart" value={JSON.stringify(cart)} />
          <input
            type="hidden"
            name="position"
            value={
              position.longtitude && position.latitude
                ? `${position.latitude},${position.longtitude}`
                : ""
            }
          />
          <Button disabled={isSubmitting} type="primary">
            {isSubmitting
              ? "Placing Order.... "
              : `Order now from ${formatCurrency(totalPrice)}`}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const order = {
    ...data,
    cart: JSON.parse(data.cart),
    priority: data.priority === "true",
  };

  const errors = {};
  if (!isValidPhone(order.phone))
    errors.phone =
      "Please give us your correct phone number. We might need it to contact you";

  // if (!isValidNumber(order.phone)) errors.num = "Please enter the 10 number ";
  if (Object.keys(errors).length > 0) return errors;

  // if everything is ok then create the new order and returnn it
  const newOrder = await createOrder(order);

  store.dispatch(clearCart());

  return redirect(`/order/${newOrder.id}`);
}

export default CreateOrder;
