
import connect from '../../utils/database'
import { ObjectId } from 'mongodb'
import { sign } from 'jsonwebtoken'
import cookie from 'cookie'


export default async (req, res) => {

    if (req.method === 'POST') {

        const { user_id, userConfig, imageUrl } = req.body

        const { db } = await connect()

        const person = await db.collection('users').findOne({ _id: ObjectId(user_id) })

        let userConfigDB
        let companyLogoDB
        let tools

        if (person.company_id) {
            const company = await db.collection('companies').findOne({ _id: ObjectId(person.company_id) })
            userConfigDB = company.userConfig
            companyLogoDB = company.profileImageUrl
            tools = company.tools
        }



        const clains = {
            sub: person._id,
            firstName: person.firstName,
            lastName: person.lastName,
            company_id: person.company_id,
            profilePicture: person.profileImageUrl,
            permissions: person.permissions,
            userStatus: person.userStatus,
            tools: tools ? tools : {
                geeCalculator: false,
                geeAgro: false,
                esgIndicators: false,
                pcaf: false
            },
            dateLimit: person.dateLimit,
            userConfig: userConfig ? userConfig : userConfigDB ? userConfigDB : '',
            companyLogo: imageUrl ? imageUrl : companyLogoDB ? companyLogoDB : '',
            active: person.active
        }

        const jwt = sign(clains, process.env.JWT_SECRET, {})

        const response = res.setHeader('Set-Cookie', cookie.serialize('auth', jwt, {
            httpOnly: false,
            secure: process.env.NODE_ENV !== true, //em produção usar true
            sameSite: 'strict',
            maxAge: 3600,
            path: '/'
        }))
        res.status(200).json({ message: 'Ok' })
    }

    else {

        res.status(400).json({ error: 'Wrong request method' })
    }

}