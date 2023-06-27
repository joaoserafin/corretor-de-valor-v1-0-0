const mail = require('@sendgrid/mail')
import { verify } from 'jsonwebtoken'

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

    const body = JSON.parse(req.body);

    const data = {
        to: body.email,
        from: {
            email: 'contato@akvo-esg.com.br',
            name: 'AKVO ESG'
        },
        templateId: 'd-8059e883a63848668b704a84029d89e2',
        dynamic_template_data: {
            firstName: body.firstName,
            password: body.password,
            link: body.link
        }
    }

    const response = await mail.send(data)

    if (response) {
        res.status(200).json({ message: 'E-mail sent.' })
    } else {
        res.status(400).json({ error: "erro" })
    }
})