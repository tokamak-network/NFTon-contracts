const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { Order, Asset, sign } = require("./exchange/utils/order");
const { ERC20, enc, ETH, ERC721, COLLECTION } = require("./exchange/utils/assets");

describe("Exchange", () => {
	const eth = "0x0000000000000000000000000000000000000000";
	const ZERO = "0x0000000000000000000000000000000000000000";
	let exchange;
	let t1;
	let t2;
	let admin;
	let user1;
	let user2;
	let erc20TransferProxy;
	let transferProxy;
	let community;
	let protocol;
	let erc721;

	async function getSignature(order, signer) {
		return sign(order, signer, exchange.address);
	}

	before(async () => {
		const TransferProxyContract = await ethers.getContractFactory("TransferProxyTest");
		const erc20TransferProxyContract = await ethers.getContractFactory("ERC20TransferProxyTest");
		const TestRoyaltiesRegistryContract = await ethers.getContractFactory("TestRoyaltiesRegistry");
		const AssetMatcherCollectionTestContract = await ethers.getContractFactory("AssetMatcherCollectionTest");

		const ExchangeContract = await ethers.getContractFactory("Exchange");
		const ERC721TestContract = await ethers.getContractFactory("TestERC721");

		const ERC20TestContract = await ethers.getContractFactory("TestERC20");
		[
            admin,
            user1,
            user2,
            community,
            protocol,
            originReceiver1,
            originReceiver2,
            payoutsReceiver1,
            payoutsReceiver2,
        ] = await ethers.getSigners();	
		
        console.log({
			admin: admin.address,
			user1: user1.address,
			user2: user2.address,
			community: community.address,
			protocol: protocol.address,
		})
		transferProxy = await TransferProxyContract.deploy();
		await transferProxy.deployed();

		erc20TransferProxy = await erc20TransferProxyContract.deploy();
		await erc20TransferProxy.deployed();

		royaltiesRegistry = await TestRoyaltiesRegistryContract.deploy();
		await royaltiesRegistry.deployed();
		exchange = await upgrades.deployProxy(ExchangeContract, [transferProxy.address, erc20TransferProxy.address, 300, community.address, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
		await exchange.deployed();
		t1 = await ERC20TestContract.deploy("T1", "S1");
		await t1.deployed();

		t2 = await ERC20TestContract.deploy("T2", "S2");
		await t2.deployed();
		
		erc721 = await ERC721TestContract.deploy();
		await erc721.deployed();

		matcher = await AssetMatcherCollectionTestContract.deploy();
		await matcher.deployed();

    	/*ETH*/
    	await exchange.setFeeReceiver(eth, protocol.address);
    	await exchange.setFeeReceiver(t1.address, protocol.address);
	});
	
    function encodeData(data) {
        return transferManagerTest.encode(data);
    }

	it("should match eth to erc20", async () => {
		await t1.connect(admin).mint(user1.address, 100);
		await t1.connect(user1).approve(erc20TransferProxy.address, 10000000);
        const originsLeft = [
            [originReceiver1.address, 100],
        ];
        const originsRight = [
            [originReceiver2.address, 200]
        ];

        const payoutsLeft = [
            [payoutsReceiver1.address, 100],
        ];
        const payoutsRight = [
            [payoutsReceiver1.address, 200]
        ];

        const encDataLeft = await encodeData(
            [payoutsLeft, originsLeft]
        );
        const encDataLeft = await encodeData(
            [payoutsLeft, originsLeft]
        );
        
        const left = Order(
            user1.address,
            Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200),
            1,
            0,
            0,
            ORDER_DATA_V1, 
            encDataLeft
        );
        const right = Order(
            user2.address,
            Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

		const right = Order(user1.address, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    	const left = Order(user2.address, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
		const tx = await exchange
			.connect(user2)
			.matchOrders(left, "0x", right, await getSignature(right, user1), { value: 300 })
		await tx.wait();
		expect(await t1.balanceOf(user1.address)).to.be.eq(0);
		expect(await t1.balanceOf(user2.address)).to.be.eq(100);
	});

});
