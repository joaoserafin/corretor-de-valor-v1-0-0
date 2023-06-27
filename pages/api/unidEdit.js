import { ObjectId } from 'bson'
import connect from '../../utils/database'
import { verify } from 'jsonwebtoken'
const mail = require('@sendgrid/mail')
import baseUrl from '../../utils/baseUrl'

mail.setApiKey(process.env.SENDGRIP_API_KEY_AKVO)


const authenticated = fn => async (req, res) => {

    verify(req.cookies.auth, process.env.JWT_SECRET, async function (err, decoded) {
        if (!err && decoded) {
            return await fn(req, res)
        }
        res.status(500).json({ message: 'You are not authenticated.' })
    })
}

export default authenticated(async (req, res) => {

    if (req.method === 'GET') {

        const {
            company_id,
            unid_id
        } = req.query

        if (!company_id && !unid_id) {
            res.status(400).json({ error: 'Missing body parameter' })
        } else {

            const { db } = await connect()


            const companyExists = await db.collection('companies').findOne({ _id: ObjectId(company_id) })
            if (!companyExists) {
                res.status(400).json({ error: 'Company not exists' })
            } else {
                const response = companyExists.unidades.filter(elem => elem._id.toString() === unid_id)

                const users = await db.collection('users').find({ company_id: { $eq: company_id } }).toArray()
                const usersPermited = users.filter(elem => !elem.permissions || elem.permissions.includes(unid_id))

                let groups = []

                if (companyExists.unidades.length > 0) {
                    companyExists.unidades.map(elem => { if (elem.group && !groups.filter(elem1 => elem1.group === elem.group).length && elem.group !== "Sem grupo") groups.push({ "group": elem.group, "groupImageUrl": elem.groupImageUrl }) })
                }
                // console.log(response)
                if (response) {
                    res.status(200).json({
                        data: response,
                        users: usersPermited,
                        userConfig: companyExists.userConfig,
                        groups: groups

                    })
                } else {
                    res.status(400).json({ message: 'Unity not Exists' })
                }
            }
        }
    }

    else if (req.method === 'PATCH') {


        const {
            company_id,
            unid_id,
            unidName,
            setorPrimario,
            setorSecundario,
            cnpj,
            inscricaoEstadual,
            cep,
            logradouro,
            numero,
            cidade,
            estado,
            localizacao,
            user_id,
            responsavel_id,
            email,
            group,
            groupImageUrl,
            responsavelStatus,
            userStatus
        } = req.body


        if (!company_id && !unid_id && !user_id) {
            res.status(400).json({ error: 'Missing body parameter' })
        } else {

            const { db } = await connect()

            const companyExists = await db.collection('companies').findOne({ _id: ObjectId(company_id) })
            if (!companyExists) {
                res.status(400).json({ error: 'Company not exists' })
            } else {
                const unidExists = companyExists.unidades.filter(elem => elem._id.toString() === unid_id)
                const groupImageChanged = unidExists[0].group === group && unidExists.groupImageUrl !== groupImageUrl ? true : false

                const response = await db.collection('companies').updateOne(
                    { _id: ObjectId(company_id), "unidades._id": ObjectId(unid_id) },
                    {
                        $set: {
                            "unidades.$.unidName": unidName,
                            "unidades.$.setorPrimario": setorPrimario,
                            "unidades.$.setorSecundario": setorSecundario,
                            "unidades.$.cnpj": cnpj,
                            "unidades.$.inscricaoEstadual": inscricaoEstadual,
                            "unidades.$.email": email,
                            "unidades.$.cep": cep,
                            "unidades.$.logradouro": logradouro,
                            "unidades.$.numero": numero,
                            "unidades.$.cidade": cidade,
                            "unidades.$.estado": estado,
                            "unidades.$.localizacao": localizacao,
                            "unidades.$.group": group,
                            "unidades.$.groupImageUrl": groupImageUrl,
                            "unidades.$.dateUpdated": new Date(),
                            "unidades.$.updatedBy": user_id,
                            "unidades.$.responsavel_id": responsavel_id,
                        }
                    })

                if (groupImageChanged) {
                    await db.collection('companies').update(
                        { "unidades.group": group },
                        { "$set": { "unidades.$[elem].groupImageUrl": groupImageUrl } },
                        { "arrayFilters": [{ "elem.group": group }], "multi": true }
                    )
                }


                if (!response) {
                    res.status(400).json({ message: 'Unity not Exists' })
                } else {
                    const oldUnid = companyExists.unidades.find(elem => elem._id.toString() === unid_id)
                    const oldResponsavel = oldUnid.responsavel_id

                    if (oldResponsavel === responsavel_id) {

                        res.status(200).json({ message: 'Unity Updated 1' })

                    } else {
                        if (responsavelStatus === 'admGlobal') {
                            sendEmail(email, unidName, baseUrl())
                            res.status(200).json({ message: 'Unity Updated 2' })
                        } else {
                            const userExists = await db.collection('users').findOne({ _id: ObjectId(responsavel_id) })
                            if (userExists.permissions && userExists.permissions.includes(unid_id)) {
                                res.status(200).json({ message: 'Unity Updated' })
                            } else {
                                const response2 = await db.collection('users').updateOne(
                                    { _id: ObjectId(responsavel_id) },
                                    {
                                        $push: { permissions: unid_id }
                                    })
                                if (response2) {
                                    res.status(200).json({ message: 'Unity Updated 3' })
                                } else {
                                    res.status(400).json({ error: "Unity cant be updated" })
                                }
                            }
                        }
                    }
                }

            }

        }

    } else {

        res.status(400).json({ error: 'Wrong request method' })

    }
}
)



const sendEmail = async (email, unidName, link) => {

    const data = {
        to: email,
        from: {
            email: 'contato@akvo-esg.com.br',
            name: 'AKVO ESG'
        },
        templateId: 'd-8857e6143edd484cac02f3a8c4b4ea96',
        dynamic_template_data: {
            unidName: unidName,
            link: link
        }
    }

    await mail.send(data)

    return
}