export const htmlMailVerify = (
  emailVerificationToken
) => ` <table width="100%" height="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f6f7">
            <tbody>
                <tr>
                    <td height="50"></td>
                </tr>
                <tr>
                    <td align="center" valign="top">
                        <table
                            width="600"
                            cellpadding="0"
                            cellspacing="0"
                            bgcolor="#ffffff"
                            style="border: 1px solid #f1f2f5"
                        >
                            <tbody>
                                <tr>
                                    <td
                                        colspan="3"
                                        height="65"
                                        bgcolor="#ffffff"
                                        style="border-bottom: 1px solid #eeeeee; padding-left: 16px"
                                        align="left"
                                    >
                                    <h2
                                    style="
                                        text-align: center;
                                        font-size: 23px;
                                        line-height: 28px;
                                        color: #3d4f58;
                                        font-weight: 500;
                                        letter-spacing: 0;
                                    "
                                >
                                    WELCOME TO NBS STORE
                                </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="3" height="20"></td>
                                </tr>
                                <tr>
                                    <td width="20"></td>
                                    <td align="left">
                                        <table cellpadding="0" cellspacing="0" width="100%">
                                            <tbody>
                                                <tr>
                                                    <td colspan="3" height="20"></td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3">
                                                        
                                                        <h4
                                                            style="
                                                                text-align: center;
                                                                font-size: 23px;
                                                                line-height: 28px;
                                                                color: #3d4f58;
                                                                font-weight: 500;
                                                                letter-spacing: 0;
                                                            "
                                                        >
                                                            Email Address Verification
                                                        </h4>
                                                        <div 
                                                            style="display: flex; justify-content: center !important; margin: 36px 0px; "
                                                        >
                                                            <div 
                                                            style="
                                                                text-align: center;
                                                                width: 100%;
                                                                display: flex; 
                                                                justify-content: center
                                                            "
                                                            > 
                                                            
                                                                
                                                            </div>
                                                        </div>
                                                        <table width="100%" style="width: 100% !important">
                                                            <tbody>
                                                                <tr>
                                                                    <td align="center">
                                                                        <a
                                                                            href="http://localhost:3000/confirm-register?emailVerificationToken=${emailVerificationToken}"
                                                                            style="
                                                                                display: inline-block;
                                                                                text-decoration: none;
                                                                                width: 159px;
                                                                            "
                                                                            target="_blank"
                                                                            data-saferedirecturl="http://localhost:3000/confirm-register?emailVerificationToken=${emailVerificationToken}"
                                                                            ><div
                                                                                style="
                                                                                    font-family: Helvetica, Arial,
                                                                                        sans-serif;
                                                                                    width: 159px;
                                                                                    text-align: center;
                                                                                    padding: 12px 0;
                                                                                    background-color: #014c8f;
                                                                                    border: 1px solid #014c8f;
                                                                                    border-radius: 3px;
                                                                                    display: block;
                                                                                    color: #ffffff;
                                                                                    font-size: 18px;
                                                                                    font-weight: normal;
                                                                                    text-decoration: none;
                                                                                    letter-spacing: normal;
                                                                                "
                                                                            >
                                                                                Verify Email
                                                                            </div></a
                                                                        >
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <p
                                                            style="
                                                                font-size: 15px;
                                                                line-height: 25px;
                                                                color: #21313c;
                                                                letter-spacing: 0;
                                                                margin: 36px 32px 33px;
                                                            "
                                                        >
                                                            Secure your account by verifying your email address.
                                                            <br />
                                                            <br />
                                                            <b
                                                                >This link will expire after 2 hours. <br/> Please click the verification button above once again to receive a new verification code sent to your new email.
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3" height="20"></td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3" style="text-align: center">
                                                        
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                    <td width="20"></td>
                                </tr>
                                <tr>
                                    <td colspan="3" height="20"></td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td height="50"></td>
                </tr>
            </tbody>
        </table>`;
