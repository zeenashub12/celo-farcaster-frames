"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import sdk from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useBalance,
  useSwitchChain,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { truncateAddress } from "@/lib/truncateAddress";
import Logo from "@/public/logo.svg";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { celo, celoAlfajores } from "viem/chains";

export default function Demo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<
    "Celo" | "celoAlfajores"
  >("Celo");

  const { switchChain } = useSwitchChain();

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const {
    data: hash,
    sendTransaction,
    isPending: isSending,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Fetch user balance
  const { data: balance } = useBalance({
    address,
    chainId: selectedNetwork === "Celo" ? celo.id : celoAlfajores.id, // Celo Mainnet: 42220, Celo Alfajores: 44787
  });

  // Handle sending tokens
  const handleSendTokens = async () => {
    if (!selectedUser || !amount || !address) {
      return;
    }

    // Validate balance
    if (balance && parseEther(amount) > balance.value) {
      setError("Insufficient balance");
      return;
    }

    try {
      // Convert amount to wei 0xe8d4a51000
      const value = parseEther(amount);

      // Send transaction
      await sendTransaction({
        to: "0xb2c687872791F1f39e2b9e52508a7B6963Ff1d7b" as `0x${string}`, // Use the user's verification address
        value: value,
        chainId: 42220,
      });
    } catch (error) {
      console.error("Error sending tokens:", error);
      setError("Failed to send tokens. Please try again.");
    }
  };

  // Handle network switch
  const handleNetworkSwitch = async (network: "Celo" | "celoAlfajores") => {
    setSelectedNetwork(network);
    await switchChain({
      chainId: network === "Celo" ? celo.id : celoAlfajores.id,
    });
  };

  // Debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch users from Pinata API
  const fetchUsers = async (query: string) => {
    if (!query) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.pinata.cloud/v3/farcaster/users?username=${query}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      } else {
        setError("No users found");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce(fetchUsers, 300);

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  // If a user is selected, show the send token form
  if (selectedUser) {
    return (
      <div className="min-h-screen flex flex-col p-4 ">
        <div className="mb-4 flex justify-end w-full ">
          <ConnectButton />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">
          Send Tokens to {selectedUser.username}
        </h1>
        <div className="flex justify-center">
          <img
            src={selectedUser.pfp_url || "/default-avatar.png"}
            alt={selectedUser.username}
            className="w-12 h-12 rounded-full"
          />
        </div>
        <div className="my-2 text-xs text-center">
          Address:{" "}
          <pre className="inline">
            {truncateAddress(selectedUser.verifications[0])}
          </pre>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Network</label>
            <select
              value={selectedNetwork}
              onChange={(e) =>
                handleNetworkSwitch(e.target.value as "Celo" | "celoAlfajores")
              }
              className="p-2 border border-gray-600 rounded-lg w-full focus:outline-none focus:border-blue-500"
            >
              <option value="Celo">Celo Mainnet</option>
              <option value="celoAlfajores">celoAlfajores</option>
            </select>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-400">
              Your Balance: {balance ? formatEther(balance.value) : "0"} CELO
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTokens();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount (CELO)
              </label>
              <input
                type="text"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="p-2 border border-gray-600 rounded-lg w-full focus:outline-none focus:border-blue-500"
              />
              {balance && amount != ""
                ? parseEther(amount) > balance.value && (
                    <p className="text-red-500 text-sm mt-1">
                      Insufficient balance
                    </p>
                  )
                : ""}
            </div>

            <button
              type="submit"
              disabled={
                isSending ||
                isConfirming ||
                (balance && parseEther(amount) > balance.value)
              }
              className="px-4 py-2 bg-yellow-300 hover:bg-yellow-500 rounded-lg w-full disabled:bg-yellow-400"
            >
              {isSending
                ? "Sending..."
                : isConfirming
                ? "Confirming..."
                : "Send Tokens"}
            </button>
          </form>

          {isConfirmed && (
            <p className="mt-4 text-green-500 text-center">
              Tokens sent successfully!
            </p>
          )}

          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
          {hash && <div>Transaction Hash: {truncateAddress(hash)}</div>}

          <button
            onClick={() => setSelectedUser(null)}
            className="mt-4 px-4 py-2 border border-black hover:bg-gray-700 rounded-lg w-full"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] mx-auto py-4 px-2">
      <div className="flex justify-center m-4">
        <Image src={Logo} width={100} height={100} alt="Celo Log" />
      </div>
      <h1 className="text-xl font-bold text-center mb-4">Frames v2 + Celo</h1>

      <div className="mb-4 flex justify-center w-full ">
        <ConnectButton />
      </div>

      <h1 className="text-xl font-bold mb-4 text-center">
        Search Farcaster Users
      </h1>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex justify-center space-x-2"
      >
        <input
          type="text"
          placeholder="Enter username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </form>

      <div className="mt-6 w-full max-w-md">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : users.length > 0 ? (
          <ul className="space-y-3">
            {users.map((user) => (
              <li
                key={user.fid}
                onClick={() => setSelectedUser(user)}
                className="flex items-center space-x-4 p-3 border border-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <img
                  src={user.pfp_url || "/default-avatar.png"}
                  alt={user.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-bold">{user.username}</p>
                  <p className="text-sm ">FID: {user.fid}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-center">
            {query ? "No results found" : "Start typing to search"}
          </p>
        )}
      </div>
    </div>
  );
}
