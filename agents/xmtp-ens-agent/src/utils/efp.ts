import axios from 'axios';

export interface Followers {
  followers: {
    efp_list_nft_token_id: string;
    address: string;
    tags: string[];
    is_following: boolean;
    is_blocked: boolean;
    is_muted: boolean;
    updated_at: string;
  }[];
}

export const getFollowers = async (
  addressOrEns: string | undefined,
  limit: number,
  offset: number
) => {
  const followers = await axios.get<Followers>(
    `https://api.ethfollow.xyz/api/v1/users/${addressOrEns}/followers?limit=${limit}&offset=${offset}`
  );

  return followers.data;
};


export interface Following {
  following: {
    version: number;
    record_type: string;
    data: string;
    tags: string[];
  }[];
}

export const getFollowing = async (
  addressOrEns: string | undefined,
  limit: number,
  offset: number
) => {
  const following = await axios.get<Following>(
    `https://api.ethfollow.xyz/api/v1/users/${addressOrEns}/following?limit=${limit}&offset=${offset}`
  );

  return following.data;
};

export interface FollowState {
  addressUser: string;
  addressFollower: string;
  state: {
    follow: boolean;
    block: boolean;
    mute: boolean;
  };
}

export const getFollowState = async (
  addressOrEns1: string | undefined,
  addressOrEns2: string | undefined
) => {
  const followState = await axios.get<FollowState>(
    `https://api.ethfollow.xyz/api/v1/users/${addressOrEns1}/${addressOrEns2}/followerState`
  );

  return followState.data;
};

export interface Stats {
  followers_count: string;
  following_count: string;
}

export const getStats = async (addressOrEns: string | undefined) => {
  const stats = await axios.get<Stats>(
    `https://api.ethfollow.xyz/api/v1/users/${addressOrEns}/stats`
  );

  return stats.data;
};
