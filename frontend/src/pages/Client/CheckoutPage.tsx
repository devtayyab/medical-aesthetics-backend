import React, { useState } from "react";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import VISA from "@/assets/Visa.png";
import AMEX from "@/assets/Amex.png";
import Mastercard from "@/assets/paypal.png";
import Paypal from "@/assets/container.png";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { FaArrowRightLong } from "react-icons/fa6";
import { BiError } from "react-icons/bi";
import { Input } from "@/components/atoms/Input/Input";
import BookingNoteModal from '@/components/Modal/BookingNoteModal';
import { Select } from "@/components/atoms/Select/Select";
import { FaBackspace, FaBackward, FaChevronLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
// Custom class for rounded bottom corners only
const roundedBottomCorners = css`
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`;

const roundedTopCorners = css`
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius:  0.5rem;
  border-top-right-radius:  0.5rem;
`;
export const CheckoutPage: React.FC = () => {

    const [isBookingNoteOpen, setBookingNoteOpen] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [nameOnCard, setNameOnCard] = useState('');

    const handleSaveNote = (note: string) => {
        console.log('Booking note saved:', note);
        // You can save the note to state or send to backend here
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCardNumber(e.target.value);
    };

    const handleExpirationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExpirationDate(e.target.value);
    };

    const handleSecurityCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSecurityCode(e.target.value);
    };

    const handleNameOnCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNameOnCard(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Card details:', cardNumber, expirationDate, securityCode, nameOnCard);
        // You can send the card details to backend here
    };

    return (
        <section
            className="relative bg-cover bg-center   px-4 py-[60px] min-h-screen"
            style={{
                backgroundImage: `url(${LayeredBG})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >


            <div className="flex max-w-7xl mx-auto  items-center text-[#33373F] text-[15px] font-medium mb-6">
                <Link
                    to="/search"
                    className=""
                >
                    <span className="px-4 flex">
                        <FaChevronLeft size={16} className="pt-[6px] text-[#767676]" />  <span>Back</span>
                    </span>

                </Link>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="md:col-span-2 space-y-6">
                    {/* Personal Details Card */}
                    <Card className="p-6 rounded-lg shadow-md bg-white">
                        <h2 className="text-xl font-semibold mb-4">Your details</h2>
                        <p className="text-sm mb-6">
                            Welcome back John, not your?{" "}
                            <a href="#" className="text-blue-600 underline">
                                Signout
                            </a>
                        </p>
                        <form className="space-y-4">
                            <div>
                                <Input
                                    label=" Full Name"
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    defaultValue="John Doe">
                                </Input>

                            </div>
                            <div>
                                <Input
                                    label="Email"
                                    id="email"
                                    name="email"
                                    type="text"
                                    defaultValue="john@gmail.com">
                                </Input>

                            </div>
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        id="countryCode"
                                        name="countryCode"
                                        defaultValue="+44"
                                        className="rounded-md border border-gray-100 shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none"
                                    >
                                        <option>+44</option>
                                        <option>+1</option>
                                        <option>+91</option>
                                    </select>


                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="Placeholder"
                                        className="flex-grow mt-1 rounded-md   shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <a
                                    href="#"
                                    className="text-blue-600 flex items-center gap-1 text-sm cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setBookingNoteOpen(true);
                                    }}
                                >
                                    <BiError className="text-blue-600" /> Add a booking note
                                </a>
                            </div>
                        </form>
                    </Card>

                    {/* Beauty Points Discount Card */}
                    <Card className="p-6 rounded-lg shadow-md bg-white">
                        <h3 className="text-[#221F1F] text-[18px] font-semibold mb-3">
                            Beauty Points Discount
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                            Use Beauty Points to get a discount on this treatment
                        </p>
                        <p className="text-sm mb-4">You have 250 Beauty Points (€25)</p>
                        <Button variant="outline" className="text-black border-black">
                            Apply Them Now?
                            <FaArrowRightLong />
                        </Button>
                    </Card>
                    {/* Payment Card */}
                    <Card className="p-6 rounded-lg shadow-lg bg-white  ">
                        <h3 className="text-lg font-semibold mb-4">Payment</h3>
                        <p className="text-xs text-gray-500 mb-6">All transactions are secured and encrypted</p>

                        <form onSubmit={handleSubmit} className="">
                            <label className={`flex items-center justify-between cursor-pointer border border-[#1773B0] bg-[#EFF5FF] p-4 ${roundedTopCorners}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="paymentMethod" value="card" className="w-6 h-6 border-2 border-blue-400 checked:bg-blue-500 checked:border-blue-500" defaultChecked />
                                    <span className="text-base font-medium">Credit or debit card</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={VISA} alt="Visa" className="h-6" />
                                    <img src={Mastercard} alt="Mastercard" className="h-6" />
                                    <img src={AMEX} alt="Amex" className="h-6" />
                                </div>
                            </label>
                            <div className="space-y-3">
                                <fieldset className={`border p-5 bg-[#F5F5F5] ${roundedBottomCorners}`}>


                                    <div className="mt-4 space-y-4">
                                        <Input
                                            type="text"
                                            placeholder="Card number"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            className=""
                                        />
                                        <div className="flex gap-4">
                                            <Input
                                                type="text"
                                                placeholder="Expiration date"
                                                value={expirationDate}
                                                onChange={handleExpirationDateChange}
                                                className="flex-1 text-base placeholder-gray-400"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="Security code"
                                                value={securityCode}
                                                onChange={handleSecurityCodeChange}
                                                className="flex-1 text-base placeholder-gray-400"
                                            />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Name on card"
                                            value={nameOnCard}
                                            onChange={handleNameOnCardChange}
                                            className="text-base placeholder-gray-400"
                                        />
                                    </div>
                                </fieldset>

                                <fieldset className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="radio" name="paymentMethod" value="paypal" className="w-5 h-5" />
                                        <span className="flex-grow">PayPal <span className="bg-green-200 text-xs rounded-full px-2 ml-4 py-0.5">90 points</span></span>

                                        <img src={Paypal} alt="PayPal" className="h-5 ml-2" />
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="radio" name="paymentMethod" value="venue" className="w-5 h-5" />
                                        <span className="flex-grow">Pay at venue

                                            <span className="bg-green-200 text-xs rounded-full ml-4 px-2 py-0.5">90 points</span>
                                        </span>

                                    </label>
                                </fieldset>

                                <fieldset className="space-y-4 mt-6 text-sm text-gray-600">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4" />
                                        I consent to my data being used for booking this medical treatment in accordance with GDPR.
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4" />
                                        Email me receipt and reminders
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        By continuing you agree to our <a href="#" className="text-blue-600 underline">Booking Terms</a>
                                    </label>
                                </fieldset>
                                <button type="submit" className="w-full bg-lime-400 text-black font-bold py-2 rounded hover:bg-lime-500 transition">
                                    Pay with card
                                </button>
                            </div>
                        </form>
                    </Card>
                    {/* Venue Policies Card */}
                    <Card className="p-6 rounded-lg shadow-md bg-white">
                        <h3 className="text-[#221F1F] text-[18px] font-semibold mb-4">
                            Venue policies
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Reschedule policy</h4>
                                <p className="text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
                                    habitasse sit fusce lobortis scelerisque purus. Sit cursus proin
                                    adipiscing risus turpis vel lacus. Pellentesque amet suspendisse
                                    turpis dui et massa cras morbi sit.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Refund policy</h4>
                                <p className="text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
                                    habitasse sit fusce lobortis scelerisque purus. Sit cursus proin
                                    adipiscing risus turpis vel lacus. Pellentesque amet suspendisse
                                    turpis dui et massa cras morbi sit.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Cancellation policy</h4>
                                <p className="text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
                                    habitasse sit fusce lobortis scelerisque purus. Sit cursus proin
                                    adipiscing risus turpis vel lacus. Pellentesque amet suspendisse
                                    turpis dui et massa cras morbi sit.
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#FCF6E8] p-6 mt-6 rounded-md flex items-center gap-4">
                            <BiError className="text-[#88640E] text-2xl flex-shrink-0" />
                            <p className="text-[#88640E]">
                                Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
                                habitasse sit fusce lobortis scelerisque purus. Sit cursus proin
                                adipiscing risus turpis vel lacus. Pellentesque amet suspendisse
                                turpis dui et massa cras morbi sit.
                            </p>
                        </div>
                    </Card>

                    {/* Terms and Conditions Checkbox Card */}
                    <Card className="p-6 rounded-lg shadow-md bg-white">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="w-5 h-5 border rounded"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur. Sit dictum nunc nec eget
                                    lorem.
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    className="w-5 h-5 border rounded"
                                />
                                <label htmlFor="privacy" className="text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur. Sed sed mi lacus sit hac id
                                    ac.
                                </label>
                            </div>
                            <p className="text-sm text-gray-500">
                                Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
                                habitasse sit fusce lobortis scelerisque purus. Sit cursus proin
                                adipiscing risus turpis vel lacus. Pellentesque amet suspendisse
                                turpis dui et massa cras morbi sit.
                            </p>
                        </div>
                    </Card>


                </div >

                {/* Right Column: Laser Hair Removal Card */}
                < div className="md:col-span-1" >
                    <Card className="p-6 rounded-lg shadow-md bg-white max-w-md mx-auto">
                        <h2 className="text-xl font-semibold mb-4">Laser Hair Removal</h2>
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-4xl font-bold">17:00</div>
                            <div className="border-l border-gray-300 h-10 mx-4"></div>
                            <div className="text-right">
                                <div className="text-sm font-medium">Sat 13 Sep</div>
                                <div className="text-xs text-gray-500">30 mins total</div>
                            </div>
                        </div>
                        <div className="text-center mb-3">
                            <a href="#" className="underline text-sm">
                                Choose a different time
                            </a>
                        </div>
                        <div className="text-sm mb-2">With first available doctor</div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Treatment Price</span>
                            <span>€120</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Beauty Points Discount</span>
                            <span className="">-€25</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base border-t border-gray-300 pt-2 mb-4">
                            <span>Total</span>
                            <span>€95</span>
                        </div>
                        <button className="w-full bg-lime-400 text-black font-bold py-2 rounded hover:bg-lime-500 transition">
                            Complete Booking
                        </button>

                    </Card>
                </div >
            </div >
            <BookingNoteModal
                isOpen={isBookingNoteOpen}
                onClose={() => setBookingNoteOpen(false)}
                onSave={handleSaveNote}
            />
        </section >
    );
};
