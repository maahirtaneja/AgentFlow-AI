import api from '../../utils/axios'

export const updateProfile = async (profile) => {
  const { data } = await api.put('/api/auth/profile', profile)
  return data
}
