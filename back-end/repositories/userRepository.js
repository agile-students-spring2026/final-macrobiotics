import { v4 as uuidv4 } from "uuid";
import User, { createDefaultPreferences } from "../models/User.js";
import { isDatabaseConnected } from "../config/database.js";

const memoryUsers = new Map();

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const toUserRecord = (user) => {
  if (!user) {
    return null;
  }

  const plainUser = user.toObject ? user.toObject() : cloneValue(user);

  return {
    id: String(plainUser._id ?? plainUser.id),
    email: plainUser.email,
    passwordHash: plainUser.passwordHash,
    preferences: cloneValue(plainUser.preferences ?? createDefaultPreferences()),
    bookmarks: cloneValue(plainUser.bookmarks ?? []),
  };
};

const saveMemoryUser = (user) => {
  memoryUsers.set(user.id, cloneValue(user));
  return cloneValue(user);
};

export const findUserByEmail = async (email) => {
  if (isDatabaseConnected()) {
    return toUserRecord(await User.findOne({ email }));
  }

  const user = [...memoryUsers.values()].find((candidate) => {
    return candidate.email === email;
  });

  return user ? cloneValue(user) : null;
};

export const findUserById = async (id) => {
  if (isDatabaseConnected()) {
    return toUserRecord(await User.findById(id));
  }

  const user = memoryUsers.get(id);
  return user ? cloneValue(user) : null;
};

export const createUser = async ({ email, passwordHash }) => {
  if (isDatabaseConnected()) {
    const createdUser = await User.create({
      email,
      passwordHash,
      preferences: createDefaultPreferences(),
      bookmarks: [],
    });

    return toUserRecord(createdUser);
  }

  return saveMemoryUser({
    id: uuidv4(),
    email,
    passwordHash,
    preferences: createDefaultPreferences(),
    bookmarks: [],
  });
};

export const replaceUser = async (user) => {
  if (isDatabaseConnected()) {
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        email: user.email,
        passwordHash: user.passwordHash,
        preferences: cloneValue(user.preferences ?? []),
        bookmarks: cloneValue(user.bookmarks ?? []),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return toUserRecord(updatedUser);
  }

  return saveMemoryUser(user);
};

export const clearUsers = async () => {
  memoryUsers.clear();

  if (isDatabaseConnected()) {
    await User.deleteMany({});
  }
};
