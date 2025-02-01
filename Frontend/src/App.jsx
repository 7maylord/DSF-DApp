import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import abi from "./abi.json";
import './App.css'

const CONTRACT_ADDRESS = "0x40Cd0edd7dAe6Ec3e7C8e6614b165EBC025aF443";

export default function ScholarshipDApp() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [scholarships, setScholarships] = useState([]);
  const [contract, setContract] = useState(null);  
  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({ name: "", age: "", course: "" });
  const [donationAmount, setDonationAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);


  useEffect(() => {
    if (walletAddress) {
      setIsConnected(true); // Set to true when wallet is connected
    } else {
      setIsConnected(false); // Set to false when wallet is not connected
    }
  }, [walletAddress]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install wallet");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);

      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setContract(contractInstance);
      const owner = await contractInstance.owner();
      setIsOwner(accounts[0].toLowerCase() === owner.toLowerCase());
      
      toast.success("Wallet Connected");
    } catch (error) {
      console.error(error);
      toast.error("Connection failed:", error);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(""); // Reset wallet address
    setIsConnected(false); // Update wallet connection status
    setContract(null); // Clear contract instance
    toast.info("Wallet Disconnected");
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Function to shorten the wallet address (e.g., 0x1234...5678)
  function shortenAddress(address) {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  }

  const applyForScholarship = async () => {
    if (!contract) return;
    try {
      const tx = await contract.applyForScholarship(formData.name, parseInt(formData.age), formData.course);
      await tx.wait();
      toast.success("Application submitted!");
      setModalType(null);
    } catch (error) {
      console.error(error);
      toast.error("Application failed:", error);
    }
  };

  const donate = async () => {
    if (!contract) return;
    try {
      const tx = await contract.donate({ value: ethers.parseEther(donationAmount) });
      await tx.wait();
      toast.success("Donation successful!");
      setModalType(null);
    } catch (error) {
      console.error(error);
      toast.error("Donation failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">DSF DApp</h1>
        {isConnected ? (
          <div>
            <p><strong>Connected Wallet:</strong> {shortenAddress(walletAddress)}</p>
            <button onClick={disconnectWallet} className="mt-4 w-full">
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <button onClick={connectWallet} className="mt-4 w-full">
            Connect Wallet
          </button>
        )}
        <div className="mt-4">
          <button onClick={() => setModalType("apply")} className="btn mr-2">Apply</button>
          <button onClick={() => setModalType("donate")} >Donate</button>
        </div>
      </div>

      {/* Apply & Donate Modal */}
      {modalType && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold">
              {modalType === "apply" ? "Apply for Scholarship" : "Donate"}
            </h2>

            {modalType === "apply" ? (
              <>
                <input name="name" type="text" placeholder="Name" className="border p-2 w-full mt-2" onChange={handleInputChange} />
                <input name="age" type="number" placeholder="Age" className="border p-2 w-full mt-2" onChange={handleInputChange} />
                <input name="course" type="text" placeholder="Course" className="border p-2 w-full mt-2" onChange={handleInputChange} />
                <button onClick={applyForScholarship} className="mt-4">Submit</button>
              </>
            ) : (
              <>
                <input type="number" placeholder="Amount (ETH)" className="border p-2 w-full mt-2" onChange={(e) => setDonationAmount(e.target.value)} />
                <button onClick={donate} className="mt-4">Donate</button>
              </>
            )}
            
            <button onClick={() => setModalType(null)} className="mt-2 bg-red-500 hover:bg-red-600 w-full">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

