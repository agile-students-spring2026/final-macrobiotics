import { expect } from "chai";
import { clearUsers, createUser, findUserByEmail, findUserById, replaceUser } from "../repositories/userRepository.js";
import { logSearchHistory, getTopSearchedRoutes } from "../repositories/searchRepository.js";

describe("userRepository (in-memory)", () => {

    beforeEach(async () => {

        await clearUsers();
    });

    describe("createUser", () => {

        it("creates a user with the given emailand passwordHash", async () => {

            const user = await createUser({ email: "test@example.com", passwordHash: "hashedpassword"});

            expect(user.email).to.equal("test@example.com");
            expect(user.passwordHash).to.equal("hashedpassword")
        })

        it("creates a user with default preferences", async () => {
            
            const user = await createUser({ email: "test@example.com", passwordHash: "hashedpassword"});
            
            expect(user.preferences).to.be.an("array").that.is.not.empty;

        })

        it("creates a user with empty bookmarks", async () => {

            const user = await createUser({ email: "test@example.com", passwordHash: "hashedpassword"});

            expect(user.bookmarks).to.be.an("array").that.is.empty;

        })

        it("assigns unique id to each user", async () => {

            const user1 = await createUser({ email: "test1@example.com", passwordHash: "hashedpassword1"});
            const user2 = await createUser({ email: "test2@example.com", passwordHash: "hashedpassword2"});

            expect(user1.id).to.not.equal(user2.id);
        })
    })

    describe("findUserByEmail", () => {

        it("returns the user when found", async () => {

            await createUser({ email: "test@example.com", passwordHash: "hashedpassword"});
            const user = await findUserByEmail("test@example.com");

            expect(user).to.not.be.null
            expect(user.email).to.equal("test@example.com")
        })

        it("returns null when no user matches email", async () => {

            const user = await findUserByEmail("test@example.com");
            expect(user).to.be.null;
        })
    })

    describe("findUserById", () => {

        it("returns the user when found", async () => {

            const created = await createUser({ email: "test@example.com", passwordHash: "hashedpassword"});
            const user = await findUserById(created.id)

            expect(user).to.not.be.null;
            expect(user.id).to.equal(created.id)

        })

        it("returns null when no user matches id", async () => {

            const user = await findUserById("noid");
            expect(user).to.be.null;
        })
    })

    describe("replaceUser", () => {

        it("updates the user email", async() => {

            const created = await createUser({ email: "old@example.com", passwordHash: "hashedpassword"});
            const updated = await replaceUser({ ...created, email: "newemail@example.com"});

            expect(updated.email).to.not.equal(created.email);
            expect(updated.email).to.equal("newemail@example.com");
        })

        it("updates the user passwordHash", async () => {

            const created = await createUser({ email: "test@example.com", passwordHash: "oldhashedpassword"});
            const updated = await replaceUser({ ...created, passwordHash: "newhashedpassword"});

            expect(updated.passwordHash).to.not.equal(created.passwordHash);
            expect(updated.passwordHash).to.equal("newhashedpassword");
        })

        it("preserves the user id after update", async() => {

            const created = await createUser({ email: "test@example.com", passwordHash: "hashedpassword"});
            const updated = await replaceUser({ ...created, email: "newemail@example.com"});

            expect(updated.id).to.equal(created.id);
        })
    })

});


describe("searchRepository", () => {

    describe("logSearchHistory", () => {
        
        it("returns null when database is not connected", async () => {

            const result = await logSearchHistory({

                origin: "JFK",
                destination: "LAX",
                travelDate: "2025-05-01"
            });

            expect(result).to.be.null;
        });
    });

    describe("getTopSearchedRoutes", () => {

        it("returns an empty array when database is not connected", async () => {

            const result = await getTopSearchedRoutes();
            
            expect(result).to.be.an("array").that.is.empty;
        });
    });
});